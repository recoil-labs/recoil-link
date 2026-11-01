---
title: Security
---

# Security

## Current status: testnet

|                        | Today                                                                                                                                                 | Before mainnet                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Validators**         | **One** validator, run by Recoil Labs (`0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB`). Every chain's default ISM accepts a message it signed (1 of 1). | Three or more validators run by different parties, with a threshold such as 2 of 3 |
| **Audit**              | Contracts are Hyperlane's, which are audited upstream; Recoil Link's own changes are **not yet audited**                                              | Audit of everything changed from upstream                                          |
| **Contract ownership** | Recoil Labs treasury Safe, **1 signer**                                                                                                               | Safe with several signers                                                          |
| **Relayer**            | One, run by Recoil Labs                                                                                                                               | Anyone may run a relayer; delivery is permissionless                               |

A single validator can sign any message. **Do not secure real value with Recoil Link's testnet deployments.**

## What protects a message

- **The ISM.** The destination Mailbox delivers a message only if the recipient's security module verifies it. The default ISM checks validator signatures over the origin Mailbox's Merkle tree.
- **Exactly once.** The Mailbox records each delivered message id and rejects a repeat.
- **Recipient checks.** Your `handle` must check `msg.sender == mailbox` and accept only expected origins and senders ([Receive messages](../build/receive-messages.md)).

The relayer cannot forge messages: it only carries signatures the ISM verifies. A relayer that stops only delays delivery; anyone can run another.

## Choosing your own ISM

A recipient can implement `interchainSecurityModule()` to use a different ISM, for example its own multisig of validators, or an aggregation of several. The Mailbox then trusts that ISM for messages to that recipient.

## Upgrades

The Mailbox sits behind a proxy whose admin is the treasury Safe. The RecoilLinkOracle has no owner and cannot be upgraded.

## Reporting a vulnerability

Contact Recoil Labs privately through [GitHub](https://github.com/recoil-labs) rather than opening a public issue.
