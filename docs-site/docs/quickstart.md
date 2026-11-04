---
sidebar_position: 3
title: Quickstart
---

# Quickstart: send your first message

Send a message from Sepolia to Base Sepolia with the `rlink` CLI and watch it arrive. About 5 minutes.

## Prerequisites

- **Node.js 22+**.
- A wallet with a little testnet ETH on **Sepolia** (gas plus the message fee, well under 0.001 ETH).

## 1. Install the CLI

```bash
npm install -g @recoillink/cli
rlink --help
```

To run it once without installing, use `npx @recoillink/cli` in place of `rlink`.

`rlink` reads chain metadata and Recoil Link's deployed addresses from the [Recoil Link registry](./reference/registry.md) on GitHub. No configuration is needed.

## 2. Provide a key

The CLI signs with the key in `HYP_KEY` (or `--key`). Use a test wallet:

```bash
read -s "HYP_KEY?Private key: " && export HYP_KEY
```

## 3. Send a message

```bash
rlink send message --origin sepolia --destination basesepolia --body "Hello from Sepolia"
```

The CLI quotes the fee, dispatches the message to a test recipient on Base Sepolia, then waits for delivery:

```text
Message ID: 0x1c16d59b…c2bca6d0
Dispatch TX: 0xa51fd6e8…786c47c0
Waiting for message delivery on destination chain...
Message was delivered!
Delivery time: 82s
```

`--quick` returns right after dispatch; `rlink status --origin sepolia --id <messageId>` (or `--dispatchTx <hash>`) checks later.

## 4. Check it on-chain

The destination Mailbox records every delivery:

```bash
cast call --rpc-url https://sepolia.base.org \
  0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20 \
  'delivered(bytes32)(bool)' <messageId>
```

## Next

- [Send messages from a contract](./build/send-messages.md)
- [Receive messages](./build/receive-messages.md)
- [Examples repository](https://github.com/recoil-labs/recoil-link-examples): runnable send and receive, cross-chain governance and deposit proofs, each with tests and a testnet script.
- Other routes: any pair of [supported networks](./reference/networks.md), e.g. `--origin bsctestnet --destination optimismsepolia`.
