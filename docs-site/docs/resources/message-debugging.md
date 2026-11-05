---
title: Message debugging
---

# Why didn't my message arrive?

Check each stage in order. Examples use Sepolia → Base Sepolia; take addresses for your chains from [Networks](../reference/networks.md).

The quickest first check is the [Recoil Link Explorer](https://recoil-link-explorer.vercel.app): paste the message id or the dispatch transaction hash to see whether the message was sent, paid for and delivered. The steps below go further.

## 1. Was it dispatched?

The dispatch transaction must have succeeded and emitted `DispatchId(messageId)` from the origin Mailbox.

```bash
cast receipt --rpc-url https://ethereum-sepolia.publicnode.com <dispatchTx> status
rlink status --origin sepolia --dispatchTx <dispatchTx>
```

A reverted dispatch usually means the fee was too low (send `quoteDispatch`'s value) or a refund to your contract failed because it cannot receive ETH ([Send messages](../build/send-messages.md#the-fee)).

## 2. Did it pay for gas?

The relayer only delivers messages with a gas payment. Messages sent through the Mailbox's default hook pay automatically. If you passed a **custom hook** that does not include the interchain gas paymaster, the message is never relayed.

## 3. Has the origin block finalised?

Validators sign only after each chain's reorg period. Expect up to ~2 minutes from BSC testnet, well under a minute from Sepolia, Base Sepolia and OP Sepolia.

## 4. Was it delivered?

```bash
cast call --rpc-url https://sepolia.base.org 0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20 \
  'delivered(bytes32)(bool)' <messageId>
```

`true` means `handle` ran successfully. Delivery is atomic: if `handle` reverts, the message is **not** delivered and the relayer retries.

## 5. Does `handle` revert?

Simulate the delivery's final call yourself as the Mailbox:

```bash
cast call --rpc-url https://sepolia.base.org --from 0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20 \
  <recipient> 'handle(uint32,bytes32,bytes)' 11155111 <senderAsBytes32> <body>
```

Common causes: the recipient rejects the origin or sender, `handle` needs more gas than was paid for ([Gas and fees](../build/gas-and-fees.md#setting-a-gas-limit)), or the recipient's own logic reverts.

## 6. Does the security module accept it?

If the recipient sets its own ISM, that ISM must accept metadata the relayer can produce. With the default ISM this is never the problem.

Still stuck? Open an issue on [GitHub](https://github.com/recoil-labs/recoil-link) with the message id and both chains.
