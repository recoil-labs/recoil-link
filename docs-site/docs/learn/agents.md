---
title: Validators and relayer
---

# Validators and relayer

Two off-chain programs make delivery happen. Neither can change what a message says.

## Validators

A validator watches **one** chain's Mailbox (more precisely, its Merkle tree hook).

1. It waits until a block is final enough (each chain's `reorgPeriod` in the registry): BSC testnet waits longer than OP Sepolia.
2. It signs a **checkpoint**: the Merkle root, the index of the latest message, and that message's id, bound to the origin domain and its Merkle tree hook.
3. It publishes signatures to storage anyone can read (a GCS bucket in production) and announces that location once on-chain, in the chain's `ValidatorAnnounce` contract.

A validator never sends transactions after its announcement and never holds user funds. What it signs is what destination ISMs trust, so its key is the security-critical one.

## Relayer

The relayer connects all chains.

1. It indexes `Dispatch` events and gas payments on every origin.
2. For each message that prepaid gas, it reads validator signatures from their announced locations until it has a threshold.
3. It calls `process(metadata, message)` on the destination Mailbox, paying gas, and retries with backoff on failure.

The relayer is **permissionless**: it carries signatures, so it cannot forge or alter messages. If it stops, messages wait; anyone can run another relayer and deliver them.

## Who runs them

Recoil Labs runs one validator and one relayer today. Before mainnet the validator set grows to several independent operators: see [Security](../operate/security.md). Who should run them, and what they get from it, is in [Operators](../operate/operators.md). To run agents yourself see [Run validators and relayers](../operate/run-agents.md).
