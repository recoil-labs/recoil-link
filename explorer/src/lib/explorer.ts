import {
  createPublicClient,
  decodeEventLog,
  fallback,
  http,
  isAddressEqual,
  toEventSelector,
  type Hex,
  type TransactionReceipt,
} from 'viem';
import {
  dispatchEvent,
  dispatchIdEvent,
  gasPaymentEvent,
  mailboxAbi,
  processEvent,
  processIdEvent,
} from './abi';
import { CHAINS, blocksIn, chainByDomain, type ExplorerChain } from './chains';
import { decodeMessage, type Message } from './message';

const DISPATCH = toEventSelector(dispatchEvent);
const PROCESS = toEventSelector(processEvent);
const PROCESS_ID = toEventSelector(processIdEvent);
const GAS_PAYMENT = toEventSelector(gasPaymentEvent);

/** Recent messages, and undelivered messages searched by id: the last 3 hours. */
const RECENT_SECONDS = 3 * 60 * 60;
/** A delivered message's dispatch is searched for up to 6 hours before its delivery. */
const BEFORE_DELIVERY_SECONDS = 6 * 60 * 60;

function makeClient(chain: ExplorerChain) {
  return createPublicClient({
    transport: fallback(
      chain.rpcs.map((url) => http(url, { timeout: 20_000, retryCount: 1 })),
    ),
  });
}
type Client = ReturnType<typeof makeClient>;
const clients = new Map<string, Client>();
function client(chain: ExplorerChain): Client {
  let c = clients.get(chain.name);
  if (c === undefined) {
    c = makeClient(chain);
    clients.set(chain.name, c);
  }
  return c;
}

export interface Sent {
  chain: ExplorerChain;
  txHash: Hex;
  blockNumber: bigint;
  timestamp: number;
  /** Paid to the gas paymaster for delivery; undefined when no payment was made in the dispatch. */
  gas?: { gasAmount: bigint; payment: bigint };
}

export interface Delivered {
  chain: ExplorerChain;
  txHash: Hex;
  blockNumber: bigint;
  timestamp: number;
}

export interface MessageView {
  id: Hex;
  message?: Message;
  sent?: Sent;
  /** Set once the destination Mailbox has processed the message. */
  delivered?: Delivered;
  /** The destination named in the message, when it is a chain this explorer knows. */
  destination?: ExplorerChain;
}

export interface SearchResult {
  messages: MessageView[];
  /** Chains that could not be reached; results may be incomplete. */
  unreachable: string[];
}

async function settle<T>(
  chains: ExplorerChain[],
  fn: (c: ExplorerChain) => Promise<T>,
) {
  const results = await Promise.allSettled(chains.map(fn));
  const ok: { chain: ExplorerChain; value: T }[] = [];
  const unreachable: string[] = [];
  results.forEach((r, i) => {
    const chain = chains.at(i);
    if (chain === undefined) return;
    if (r.status === 'fulfilled') ok.push({ chain, value: r.value });
    else unreachable.push(chain.displayName);
  });
  return { ok, unreachable };
}

async function blockTime(
  chain: ExplorerChain,
  blockNumber: bigint,
): Promise<number> {
  const block = await client(chain).getBlock({ blockNumber });
  return Number(block.timestamp);
}

/** Messages a transaction dispatched from `chain`'s Mailbox, with their gas payments. */
async function sentInReceipt(
  chain: ExplorerChain,
  receipt: TransactionReceipt,
): Promise<MessageView[]> {
  const payments = new Map<Hex, { gasAmount: bigint; payment: bigint }>();
  for (const log of receipt.logs) {
    if (
      log.topics[0] !== GAS_PAYMENT ||
      !isAddressEqual(log.address, chain.igp)
    )
      continue;
    const { args } = decodeEventLog({
      abi: [gasPaymentEvent],
      data: log.data,
      topics: log.topics,
    });
    payments.set(args.messageId, {
      gasAmount: args.gasAmount,
      payment: args.payment,
    });
  }
  const timestamp = await blockTime(chain, receipt.blockNumber);
  const views: MessageView[] = [];
  for (const log of receipt.logs) {
    if (
      log.topics[0] !== DISPATCH ||
      !isAddressEqual(log.address, chain.mailbox)
    )
      continue;
    const { args } = decodeEventLog({
      abi: [dispatchEvent],
      data: log.data,
      topics: log.topics,
    });
    const message = decodeMessage(args.message);
    views.push({
      id: message.id,
      message,
      destination: chainByDomain(message.destination),
      sent: {
        chain,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        timestamp,
        gas: payments.get(message.id),
      },
    });
  }
  return views;
}

/** Where and when `id` was delivered on `chain`, or undefined if it was not. */
async function deliveryOn(
  chain: ExplorerChain,
  id: Hex,
): Promise<Delivered | undefined> {
  const c = client(chain);
  const at = await c.readContract({
    address: chain.mailbox,
    abi: mailboxAbi,
    functionName: 'processedAt',
    args: [id],
  });
  if (at === 0) return undefined;
  const blockNumber = BigInt(at);
  const logs = await c.getLogs({
    address: chain.mailbox,
    event: processIdEvent,
    args: { messageId: id },
    fromBlock: blockNumber,
    toBlock: blockNumber,
  });
  const log = logs.at(0);
  if (log === undefined || log.transactionHash === null)
    throw new Error(`ProcessId for ${id} missing in block ${blockNumber}`);
  return {
    chain,
    txHash: log.transactionHash,
    blockNumber,
    timestamp: await blockTime(chain, blockNumber),
  };
}

/** About the block `chain` was at, at `timestamp`: estimated from the tip, then corrected once. */
async function blockAt(
  chain: ExplorerChain,
  timestamp: number,
): Promise<bigint> {
  const c = client(chain);
  const tip = await c.getBlock();
  if (timestamp >= Number(tip.timestamp)) return tip.number;
  const guess = tip.number - blocksIn(chain, Number(tip.timestamp) - timestamp);
  if (guess <= 0n) return 0n;
  const at = Number((await c.getBlock({ blockNumber: guess })).timestamp);
  const corrected =
    guess + BigInt(Math.round((timestamp - at) / chain.blockTime));
  if (corrected < 0n) return 0n;
  return corrected > tip.number ? tip.number : corrected;
}

/** Searches `chain` for the transaction that dispatched `id`, newest blocks first, from `to` back `span` blocks. */
async function findDispatch(
  chain: ExplorerChain,
  id: Hex,
  to: bigint,
  span: bigint,
): Promise<Hex | undefined> {
  const c = client(chain);
  const stop = to > span ? to - span : 0n;
  while (to >= stop) {
    const from = to - stop > chain.logRange ? to - chain.logRange + 1n : stop;
    const logs = await c.getLogs({
      address: chain.mailbox,
      event: dispatchIdEvent,
      args: { messageId: id },
      fromBlock: from,
      toBlock: to,
    });
    const hash = logs.at(0)?.transactionHash;
    if (hash) return hash;
    if (from === 0n) break;
    to = from - 1n;
  }
  return undefined;
}

/** Where to look for `id`'s dispatch on `chain`: before its delivery if known, else the recent past. */
async function dispatchOn(
  chain: ExplorerChain,
  id: Hex,
  deliveredAt?: number,
): Promise<Hex | undefined> {
  if (deliveredAt === undefined) {
    const tip = await client(chain).getBlockNumber();
    return findDispatch(chain, id, tip, blocksIn(chain, RECENT_SECONDS));
  }
  // A little past the delivery time too, in case the block-time estimate runs early.
  const to = await blockAt(chain, deliveredAt + 60);
  return findDispatch(chain, id, to, blocksIn(chain, BEFORE_DELIVERY_SECONDS));
}

async function withDelivery(view: MessageView): Promise<MessageView> {
  if (view.destination === undefined) return view;
  return { ...view, delivered: await deliveryOn(view.destination, view.id) };
}

async function byTransaction(hash: Hex): Promise<SearchResult> {
  const { ok, unreachable } = await settle(CHAINS, (chain) =>
    client(chain)
      .getTransactionReceipt({ hash })
      .catch(() => undefined),
  );
  for (const { chain, value: receipt } of ok) {
    if (receipt === undefined) continue;
    const sent = await sentInReceipt(chain, receipt);
    if (sent.length > 0)
      return {
        messages: await Promise.all(sent.map(withDelivery)),
        unreachable,
      };
    // A delivery transaction: look up each message it processed.
    const ids = receipt.logs
      .filter(
        (l) =>
          l.topics[0] === PROCESS_ID &&
          isAddressEqual(l.address, chain.mailbox),
      )
      .map((l) => l.topics[1])
      .filter((t): t is Hex => t !== undefined);
    if (ids.length > 0) {
      const found = await Promise.all(ids.map(byId));
      return {
        messages: found.flatMap((f) => f.messages),
        unreachable: [...unreachable, ...found.flatMap((f) => f.unreachable)],
      };
    }
    return { messages: [], unreachable };
  }
  return { messages: [], unreachable };
}

async function byId(id: Hex): Promise<SearchResult> {
  const deliveries = await settle(CHAINS, (chain) => deliveryOn(chain, id));
  const delivered = deliveries.ok.find((d) => d.value !== undefined)?.value;

  // The dispatch: on the origin named by the delivery, else wherever it turns up recently.
  let originChains = CHAINS;
  if (delivered) {
    const receipt = await client(delivered.chain).getTransactionReceipt({
      hash: delivered.txHash,
    });
    // The Mailbox emits Process immediately before each message's ProcessId.
    const at = receipt.logs.findIndex(
      (l) =>
        l.topics[0] === PROCESS_ID &&
        l.topics[1] === id &&
        isAddressEqual(l.address, delivered.chain.mailbox),
    );
    const process = at > 0 ? receipt.logs.at(at - 1) : undefined;
    if (
      process &&
      process.topics[0] === PROCESS &&
      isAddressEqual(process.address, delivered.chain.mailbox)
    ) {
      const { args } = decodeEventLog({
        abi: [processEvent],
        data: process.data,
        topics: process.topics,
      });
      originChains = CHAINS.filter((c) => c.domain === args.origin);
    }
  }
  const searches = await settle(originChains, (chain) =>
    dispatchOn(chain, id, delivered?.timestamp),
  );
  const unreachable = [...deliveries.unreachable, ...searches.unreachable];
  const hit = searches.ok.find((s) => s.value !== undefined);
  if (hit && hit.value) {
    const receipt = await client(hit.chain).getTransactionReceipt({
      hash: hit.value,
    });
    const view = (await sentInReceipt(hit.chain, receipt)).find(
      (v) => v.id === id,
    );
    if (view)
      return {
        messages: [
          delivered ? { ...view, delivered } : await withDelivery(view),
        ],
        unreachable,
      };
  }
  // Delivered, but the dispatch is older than the search window.
  if (delivered) return { messages: [{ id, delivered }], unreachable };
  return { messages: [], unreachable };
}

/**
 * Looks up a message id or a transaction hash (a dispatch or a delivery).
 * Both are 32-byte hashes, so a transaction is tried first.
 */
export async function search(query: Hex): Promise<SearchResult> {
  const asTx = await byTransaction(query);
  if (asTx.messages.length > 0) return asTx;
  const asId = await byId(query);
  return {
    messages: asId.messages,
    unreachable: [...new Set([...asTx.unreachable, ...asId.unreachable])],
  };
}

export interface RecentRow {
  id: Hex;
  origin: ExplorerChain;
  destination?: ExplorerChain;
  destinationDomain: number;
  txHash: Hex;
  timestamp: number;
  delivered: boolean;
}

/** The newest messages sent on every chain in the last `RECENT_SECONDS`. */
export async function recentMessages(
  limit = 12,
): Promise<{ rows: RecentRow[]; unreachable: string[] }> {
  const { ok, unreachable } = await settle(CHAINS, async (chain) => {
    const c = client(chain);
    const tip = await c.getBlockNumber();
    const span = blocksIn(chain, RECENT_SECONDS);
    const stop = tip > span ? tip - span : 0n;
    const logs = [];
    for (let to = tip; to >= stop;) {
      const from = to - stop > chain.logRange ? to - chain.logRange + 1n : stop;
      logs.unshift(
        ...(await c.getLogs({
          address: chain.mailbox,
          event: dispatchEvent,
          fromBlock: from,
          toBlock: to,
        })),
      );
      if (from === 0n) break;
      to = from - 1n;
    }
    const newest = logs.slice(-limit);
    const times = new Map<bigint, number>();
    for (const blockNumber of new Set(newest.map((l) => l.blockNumber))) {
      if (blockNumber !== null)
        times.set(blockNumber, await blockTime(chain, blockNumber));
    }
    return newest.flatMap((log): RecentRow[] => {
      if (
        log.args.message === undefined ||
        log.transactionHash === null ||
        log.blockNumber === null
      )
        return [];
      const message = decodeMessage(log.args.message);
      return [
        {
          id: message.id,
          origin: chain,
          destination: chainByDomain(message.destination),
          destinationDomain: message.destination,
          txHash: log.transactionHash,
          timestamp: times.get(log.blockNumber) ?? 0,
          delivered: false,
        },
      ];
    });
  });
  const rows = ok
    .flatMap((r) => r.value)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  const statuses = await Promise.allSettled(
    rows.map(async (r) =>
      r.destination
        ? (await deliveryOn(r.destination, r.id)) !== undefined
        : false,
    ),
  );
  return {
    rows: rows.map((r, i) => {
      const s = statuses.at(i);
      return { ...r, delivered: s?.status === 'fulfilled' ? s.value : false };
    }),
    unreachable,
  };
}
