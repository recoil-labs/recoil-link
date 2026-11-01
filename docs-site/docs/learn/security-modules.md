---
title: Security modules (ISMs)
---

# Interchain security modules

An **interchain security module (ISM)** decides whether a message delivered to a chain is genuine. The destination Mailbox asks the recipient's ISM before calling `handle`; if `verify` returns false, the message is not delivered.

## Which ISM a message uses

1. If the recipient implements `interchainSecurityModule()` and returns a non-zero address, that one.
2. Otherwise the Mailbox's **default ISM**.

On every Recoil Link testnet the default ISM is a **message-id multisig** accepting messages signed by the Recoil Link validator (1 of 1). See [Validators](../reference/validators.md).

## The interface

```solidity
interface IInterchainSecurityModule {
    function moduleType() external view returns (uint8);
    function verify(bytes calldata metadata, bytes calldata message) external returns (bool);
}
```

`metadata` is what the relayer supplies (for a multisig, the validator signatures); `message` is the packed [message](../reference/message-format.md).

## Types in the codebase

| Type                              | `moduleType` | Verifies                                                                                                                       |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Message-id multisig**           | 5            | `threshold` of a fixed validator set signed a checkpoint for this message id. The default on Recoil Link.                      |
| **Merkle-root multisig**          | 4            | Validators signed a Merkle root; the relayer proves the message is in that tree. Same trust, cheaper signing, larger metadata. |
| **Weighted multisig**             | 9, 10        | As above with per-validator weights.                                                                                           |
| **Routing**                       | 1            | Picks another ISM per origin domain (e.g. different validator sets per chain).                                                 |
| **Aggregation**                   | 2            | Requires `m` of `n` other ISMs to pass, e.g. a multisig **and** another proof system.                                          |
| **Pausable**, **trusted relayer** |              | Emergency stop; accept only one relayer's deliveries.                                                                          |

Sources: [`solidity/contracts/isms`](https://github.com/recoil-labs/recoil-link/tree/main/solidity/contracts/isms).

## Writing your own

Implement the interface and return it from your recipient:

```solidity
contract MyRecipient is IMessageRecipient {
    IInterchainSecurityModule public immutable ism;

    constructor(IInterchainSecurityModule _ism) { ism = _ism; }

    function interchainSecurityModule() external view returns (IInterchainSecurityModule) {
        return ism;
    }

    function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable {
        // only reached if `ism.verify` passed
    }
}
```

Your ISM is now the only thing standing between the world and your `handle`: a bug in `verify` lets anyone deliver forged messages. Prefer composing the existing types (routing, aggregation) over writing new verification logic. A custom ISM that needs metadata the standard relayer does not provide also needs a relayer that provides it.
