---
title: FAQ
---

# FAQ

### Is Recoil Link compatible with Hyperlane?

At the code level, yes: same contract interfaces, ABIs and message format, so apps written for Hyperlane's `IMailbox` and `IMessageRecipient` work with Recoil Link's addresses. At the network level, no: separate Mailboxes, validators and relayers. A message sent through Recoil Link is never delivered by Hyperlane, and vice versa.

### Does Recoil Link bridge tokens?

No. Recoil Link is a messaging and proof layer. Moving value cross-chain is done by applications on top of it, for example intent systems that prove fills with [RecoilLinkOracle](./build/prove-intent-fills.md).

### How long does delivery take?

20–140 seconds on testnet, depending mostly on how long the origin chain takes to finalise blocks.

### How much does a message cost?

Destination gas plus a 30% margin, paid on the origin chain; the protocol fee is 0. Ask `quoteDispatch`. See [Gas and fees](./build/gas-and-fees.md).

### My message was dispatched but never delivered. Why?

Most often: it did not pay for gas (call `quoteDispatch` and send that value), the recipient's `handle` reverts, or `handle` needs more gas than was paid for. `rlink status --origin <chain> --id <messageId>` shows whether it was delivered.

### Which chains are supported?

Sepolia, Base Sepolia, OP Sepolia and BSC testnet: [Networks](./reference/networks.md). Polygon Amoy is next; the codebase also supports Solana and other VMs, to be deployed later.

### Is there an explorer?

Yes: the [Recoil Link Explorer](https://recoil-link-explorer.vercel.app). Paste a message id, or the hash of the transaction that sent or delivered it, to see whether it was paid for and delivered, and how long it took. From the command line, `rlink status` does the same.

### Can I use it on mainnet?

Not yet. See [Security](./operate/security.md) for what comes first.
