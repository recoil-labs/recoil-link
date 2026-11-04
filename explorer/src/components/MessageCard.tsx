import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { chainByDomain, txUrl, type ExplorerChain } from '../lib/chains';
import type { MessageView } from '../lib/explorer';
import { amount, duration, localTime, short } from '../lib/format';
import { docs } from '../lib/links';
import { bodyText, bytes32ToAddress } from '../lib/message';

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      },
      () => setDone(false),
    );
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy"
      className="ml-1.5 inline-flex text-faint hover:text-text"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function TxLink({ chain, hash }: { chain: ExplorerChain; hash: string }) {
  return (
    <a
      href={txUrl(chain, hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
    >
      {short(hash)} <ExternalLink className="size-3" />
    </a>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-border py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm text-faint">{label}</dt>
      <dd className="min-w-0 break-all text-sm">{children}</dd>
    </div>
  );
}

function Status({ view }: { view: MessageView }) {
  if (view.delivered)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-sm font-medium text-mint">
        <CheckCircle2 className="size-4" /> Delivered
      </span>
    );
  if (view.message && view.destination === undefined)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-sm font-medium text-muted">
        <HelpCircle className="size-4" /> Unknown destination
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-sm font-medium text-amber-500">
      <Clock className="size-4" /> Waiting for delivery
    </span>
  );
}

export function MessageCard({ view, now }: { view: MessageView; now: number }) {
  const { message, sent, delivered } = view;
  const origin =
    sent?.chain ?? (message ? chainByDomain(message.origin) : undefined);
  const destination = delivered?.chain ?? view.destination;
  const text = message ? bodyText(message.body) : undefined;

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-lg font-medium">
          <span>{origin?.displayName ?? 'Unknown origin'}</span>
          <ArrowRight className="size-4 text-faint" />
          <span>
            {destination?.displayName ??
              (message ? `Domain ${message.destination}` : 'Unknown')}
          </span>
        </div>
        <Status view={view} />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        <li className="rounded-xl bg-bg-deep p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            Sent
          </p>
          {sent ? (
            <>
              <p className="mt-1 text-sm">{localTime(sent.timestamp)}</p>
              <p className="mt-1 text-sm">
                <TxLink chain={sent.chain} hash={sent.txHash} />
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">
              More than 6 hours before delivery; search by the transaction hash
              to see it.
            </p>
          )}
        </li>
        <li className="rounded-xl bg-bg-deep p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            Delivered
          </p>
          {delivered ? (
            <>
              <p className="mt-1 text-sm">
                {localTime(delivered.timestamp)}
                {sent && (
                  <span className="text-muted">
                    {' '}
                    · after {duration(delivered.timestamp - sent.timestamp)}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm">
                <TxLink chain={delivered.chain} hash={delivered.txHash} />
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {sent
                ? `Not yet, ${duration(Math.max(0, Math.floor(now - sent.timestamp)))} after sending.`
                : 'Not yet.'}{' '}
              Validators sign once the origin block is final, then the relayer
              delivers. This page checks again every 10 seconds.
            </p>
          )}
        </li>
      </ol>

      {sent && !sent.gas && !delivered && (
        <p className="mt-4 rounded-xl border border-amber-400/40 p-4 text-sm">
          No gas payment was made with this message, so the relayer will not
          deliver it. See{' '}
          <a
            className="text-primary hover:underline"
            href={docs('/docs/resources/message-debugging')}
          >
            Message debugging
          </a>
          .
        </p>
      )}

      <dl className="mt-6">
        <Row label="Message id">
          <span className="font-mono">{view.id}</span>
          <CopyButton value={view.id} />
        </Row>
        {message && (
          <>
            <Row label="Nonce">{message.nonce}</Row>
            <Row label="Sender">
              <span className="font-mono">
                {bytes32ToAddress(message.sender)}
              </span>
            </Row>
            <Row label="Recipient">
              <span className="font-mono">
                {bytes32ToAddress(message.recipient)}
              </span>
            </Row>
            <Row label="Body">
              {text !== undefined && <p className="mb-1">“{text}”</p>}
              <p className="font-mono text-xs text-muted">
                {message.body === '0x' ? 'Empty' : message.body}
              </p>
            </Row>
          </>
        )}
        {sent?.gas && (
          <Row label="Gas paid">
            {amount(sent.gas.payment, sent.chain.nativeSymbol)} for{' '}
            {sent.gas.gasAmount.toLocaleString()} gas on the destination
          </Row>
        )}
      </dl>
    </article>
  );
}
