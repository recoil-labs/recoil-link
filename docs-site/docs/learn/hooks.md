---
title: Hooks
---

# Post-dispatch hooks

A **hook** runs on the origin chain right after `dispatch` records a message. Hooks are how a message gets into the validators' Merkle tree and how it pays for delivery. `quoteDispatch` is the sum of what the hooks charge.

## Required and default

Each Mailbox has two:

|                   | Runs                             | Can an app change it?               | On Recoil Link                                                           |
| ----------------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **Required hook** | On every message                 | No                                  | **Protocol fee** hook, fee 0                                             |
| **Default hook**  | Unless the sender passes its own | Yes (`dispatch` with a custom hook) | **Aggregation** of the Merkle tree hook and the interchain gas paymaster |

## The hooks in use

**Merkle tree hook.** Appends each message id to an incremental Merkle tree. Validators sign this tree's checkpoints; without it a message cannot be proven. An app replacing the default hook must keep a Merkle tree hook in its own hook, or its messages will never be signed.

**Interchain gas paymaster (IGP).** Charges for delivery gas on the destination: `(gas limit + overhead) × destination gas price × exchange rate`, prices set by a gas oracle with Recoil Link's margin. Collected fees go to the Recoil Labs treasury; the relayer is reimbursed from them. See [Gas and fees](../build/gas-and-fees.md).

**Protocol fee.** A flat fee per message, set by the treasury Safe up to a maximum fixed at deployment. Zero today.

**Aggregation hook.** Runs several hooks in order and adds up their quotes.

## Hook metadata

The 4-argument `dispatch(destination, recipient, body, metadata)` passes metadata to the hooks: a gas limit for the IGP, a refund address, a value to forward. Built with [`StandardHookMetadata`](../build/developer-tools.md#standardhookmetadata).

## Refunds

A hook that receives more than it charges refunds the difference to the refund address in the metadata, defaulting to the **message sender** (the contract that called `dispatch`). If that contract cannot receive ETH, the dispatch reverts.
