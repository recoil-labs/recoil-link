---
sidebar_position: 1
title: What is Recoil Link
slug: /intro
---

# What is Recoil Link

Recoil Link is a **cross-chain messaging and proof layer** by Recoil Labs. A contract on one chain sends a message; Recoil Link's validators attest to it, and its relayer delivers it to a contract on another chain. The receiving contract can then act on proof that something happened on the origin chain.

Typical uses:

- **Proving intent fills.** A solver delivers funds on chain B; a message proves it on chain A, and the escrow there pays the solver. Recoil Link ships an [Open Intents Framework oracle](./build/prove-intent-fills.md) for exactly this. [RecoilPay](https://v2.recoilpay.com) uses it.
- **Cross-chain calls and state.** Any bytes you can encode: governance actions, price or state updates, cross-chain accounts.

## What you get

|                             |                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Mailbox**                 | One contract per chain. Apps call `dispatch` to send and implement `handle` to receive.                 |
| **Security modules (ISMs)** | Decide whether a delivered message is valid. By default: signatures from the Recoil Link validator set. |
| **Gas payment**             | Senders prepay destination gas on the origin chain; the relayer delivers prepaid messages.              |
| **Agents**                  | Validators (sign what was sent) and a relayer (delivers it). Run by Recoil Labs today.                  |

## Status

Recoil Link is live on **testnets**: Sepolia, Base Sepolia, OP Sepolia and BSC testnet. Mainnet follows a security audit and a multi-party validator set; see [Security](./operate/security.md).

## Relationship to Hyperlane

Recoil Link is a fork of [Hyperlane](https://github.com/hyperlane-xyz/hyperlane-monorepo) (Apache-2.0). It keeps Hyperlane's contract interfaces and message format, so code written against Hyperlane's `IMailbox` and `IMessageRecipient` works with Recoil Link's contracts. It runs its own **separate** deployments, validators and relayer: a message sent through a Recoil Link Mailbox is never delivered by Hyperlane, and vice versa.

Recoil Link focuses on messaging and proofs. Hyperlane's token bridging ("warp routes") is not part of Recoil Link.

## Next

- [How it works](./how-it-works.md): the life of a message.
- [Quickstart](./quickstart.md): send a message between two testnets in a few minutes.
