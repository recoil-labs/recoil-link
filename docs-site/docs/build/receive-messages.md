---
title: Receive messages
---

# Receive messages

A recipient implements `handle`. The destination Mailbox calls it once per message, after the message's security module (ISM) has verified it.

## Minimal recipient

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMessageRecipient {
    function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable;
}

contract Receiver is IMessageRecipient {
    address public immutable mailbox;
    uint32 public immutable trustedOrigin;
    bytes32 public immutable trustedSender;

    event Received(uint32 origin, bytes32 sender, bytes message);

    constructor(address _mailbox, uint32 _trustedOrigin, address _trustedSender) {
        mailbox = _mailbox;
        trustedOrigin = _trustedOrigin;
        trustedSender = bytes32(uint256(uint160(_trustedSender)));
    }

    function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable override {
        require(msg.sender == mailbox, "only mailbox");
        require(origin == trustedOrigin && sender == trustedSender, "untrusted sender");
        emit Received(origin, sender, message);
    }
}
```

## The three checks that matter

1. **`msg.sender == mailbox`.** Anyone can call `handle` directly. Only calls from the Mailbox have been verified.
2. **Origin and sender.** Anyone can send a message to your contract through the Mailbox. Accept only the origin domains and sender contracts you expect.
3. **Keep `handle` within its gas.** The sender paid for a fixed gas limit (50,000 by default). A `handle` that needs more fails on delivery; ask senders to pay for more ([Gas and fees](./gas-and-fees.md)).

Each message is delivered **at most once**: the Mailbox rejects a second `process` of the same message.

## Security module

By default the Mailbox's **default ISM** verifies messages: on every testnet today, a signature from the Recoil Link validator. A recipient can choose its own by implementing:

```solidity
function interchainSecurityModule() external view returns (address);
```

Returning `address(0)` keeps the default. See [Security](../operate/security.md) before relying on the testnet validator set for anything of value.
