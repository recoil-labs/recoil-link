---
title: Glossary
---

# Glossary

**Aggregation hook / ISM.** Combines several hooks (run all) or ISMs (require `m` of `n`).

**Checkpoint.** What a validator signs: a Merkle root, an index and the latest message id, bound to an origin domain and its Merkle tree hook.

**Default hook.** The hook a Mailbox runs for messages that do not name their own. On Recoil Link: Merkle tree hook plus interchain gas paymaster.

**Default ISM.** The security module a Mailbox uses for recipients that do not name their own.

**Dispatch.** Sending a message: `Mailbox.dispatch`.

**Domain id.** A `uint32` identifying a chain. Equal to the chain id on every EVM network Recoil Link supports.

**Hook (post-dispatch hook).** Code the origin Mailbox runs after recording a message: Merkle tree, gas payment, protocol fee.

**Interchain gas paymaster (IGP).** Hook that charges senders for destination gas and pays the relayer.

**ISM (interchain security module).** Contract on the destination that decides whether a message is genuine.

**Mailbox.** The one contract per chain apps call to send (`dispatch`) and that calls recipients (`handle`).

**Merkle tree hook.** Records every message id in an incremental Merkle tree that validators sign.

**Message id.** `keccak256` of the packed message; unique.

**Metadata.** Extra bytes: hook metadata (gas limit, refund address) passed on dispatch; ISM metadata (signatures) supplied by the relayer on delivery.

**OIF (Open Intents Framework).** Standard contracts for cross-chain intents: escrows, settlers, oracles.

**Process.** Delivering a message: `Mailbox.process(metadata, message)`, called by the relayer.

**Protocol fee.** Flat per-message fee charged by the required hook. Zero on Recoil Link today.

**RecoilLinkOracle.** OIF oracle that proves fills over Recoil Link.

**Registry.** Public repository of chain metadata and Recoil Link deployment addresses.

**Relayer.** Off-chain agent that delivers messages and pays destination gas.

**Required hook.** The hook a Mailbox runs on every message, whatever the sender chooses.

**Validator.** Off-chain agent that signs checkpoints for one origin chain.

**Validator announce.** Contract where each validator records, once, where its signatures are stored.
