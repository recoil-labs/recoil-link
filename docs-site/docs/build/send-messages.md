---
title: Send messages
---

# Send messages from a contract

A contract sends a message by calling `dispatch` on its chain's Mailbox, paying the fee from `quoteDispatch`. A runnable sender like the one below, with tests and a testnet script, is `HelloSender` in the [examples repository](https://github.com/recoil-labs/recoil-link-examples).

## Minimal sender

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMailbox {
    function dispatch(uint32 destinationDomain, bytes32 recipientAddress, bytes calldata messageBody)
        external payable returns (bytes32 messageId);

    function quoteDispatch(uint32 destinationDomain, bytes32 recipientAddress, bytes calldata messageBody)
        external view returns (uint256 fee);
}

contract Sender {
    IMailbox public immutable mailbox;

    constructor(address _mailbox) {
        mailbox = IMailbox(_mailbox);
    }

    function send(uint32 destination, address recipient, bytes calldata body)
        external payable returns (bytes32 messageId)
    {
        bytes32 to = bytes32(uint256(uint160(recipient)));
        uint256 fee = mailbox.quoteDispatch(destination, to, body);
        require(msg.value >= fee, "fee too low");
        messageId = mailbox.dispatch{value: fee}(destination, to, body);
        // Refund anything above the fee.
        if (msg.value > fee) payable(msg.sender).transfer(msg.value - fee);
    }
}
```

Deploy it with your chain's Mailbox address from [Networks](../reference/networks.md), for example Sepolia's `0xA066332EF9C28158BDCf45D1a6138219e86CB6c6`.

Instead of declaring the interface yourself, you can import it from Recoil Link's Solidity package (`npm install @recoillink/core`, see [Testing](./testing.md#getting-the-contracts) for the setup):

```solidity
import {IMailbox} from "@recoillink/core/contracts/interfaces/IMailbox.sol";
```

## The fee

`quoteDispatch` returns what the Mailbox's hooks charge:

- the **gas payment** for delivery on the destination (by default for 50,000 gas of `handle` execution plus verification overhead), and
- the **protocol fee**, 0 today.

Always quote just before dispatching: gas prices change. Underpaying reverts. **Overpaying is refunded to the message's sender, i.e. your contract**, unless the hook metadata names another refund address. A sending contract that overpays and cannot receive ETH makes the whole `dispatch` revert, so either send exactly the quote (as above) or give the contract a `receive()` function. If your recipient's `handle` needs more than 50,000 gas, pass a gas limit, see [Gas and fees](./gas-and-fees.md).

## The message id

`dispatch` returns a `messageId` (the keccak256 of the encoded [message](../reference/message-format.md)). It is unique and is what the destination Mailbox records: `delivered(messageId)` turns true once the message is handled.

## Who the recipient sees as sender

The recipient's `handle` receives `sender` = **your contract's address** (as `bytes32`), not the user who called it. If the recipient needs the user, put it in the body.
