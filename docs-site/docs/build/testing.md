---
title: Testing with MockMailbox
---

# Testing with MockMailbox

`MockMailbox` is a Mailbox for unit tests. Two of them in one test act as two chains: dispatching on one queues the message on the other, and `processNextInboundMessage()` delivers it with a test security module. No chains, validators or relayers.

## Getting the contracts

The contracts come from Recoil Link's Solidity package on npm:

```bash
npm install @recoillink/core
```

The contracts import OpenZeppelin 4.9.3, so your project must resolve those imports too. `MockMailbox` is at `@recoillink/core/contracts/mock/MockMailbox.sol`.

**Foundry.** The package bundles the OpenZeppelin and forge-std versions it was built with. Point `remappings.txt` at them:

```text title="remappings.txt"
@recoillink/core/=node_modules/@recoillink/core/
@openzeppelin/contracts/=node_modules/@recoillink/core/dependencies/@openzeppelin-contracts-4.9.3/contracts/
@openzeppelin/contracts-upgradeable/=node_modules/@recoillink/core/dependencies/@openzeppelin-contracts-upgradeable-4.9.3/contracts/
forge-std/=node_modules/@recoillink/core/dependencies/forge-std-1.9.2/src/
```

Set `libs = ["node_modules"]` in `foundry.toml`. The [examples repository](https://github.com/recoil-labs/recoil-link-examples) has a working setup.

**Hardhat.** Install the same OpenZeppelin versions next to it; Hardhat resolves the rest from `node_modules`:

```bash
npm install @openzeppelin/contracts@4.9.3 @openzeppelin/contracts-upgradeable@4.9.3
```

## Example

Testing the [Sender](./send-messages.md) and [Receiver](./receive-messages.md) examples with Foundry:

```solidity title="test/SenderReceiver.t.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MockMailbox} from "@recoillink/core/contracts/mock/MockMailbox.sol";
import {Sender} from "../src/Sender.sol";
import {Receiver} from "../src/Receiver.sol";

contract SenderReceiverTest is Test {
    uint32 constant ORIGIN = 1;
    uint32 constant DESTINATION = 2;

    MockMailbox originMailbox;
    MockMailbox destinationMailbox;
    Sender sender;
    Receiver receiver;

    function setUp() public {
        originMailbox = new MockMailbox(ORIGIN);
        destinationMailbox = new MockMailbox(DESTINATION);
        originMailbox.addRemoteMailbox(DESTINATION, destinationMailbox);
        destinationMailbox.addRemoteMailbox(ORIGIN, originMailbox);

        sender = new Sender(address(originMailbox));
        receiver = new Receiver(address(destinationMailbox), ORIGIN, address(sender));
    }

    function test_messageIsDelivered() public {
        sender.send(DESTINATION, address(receiver), "hello");

        vm.expectEmit(true, true, true, true, address(receiver));
        emit Receiver.Received(ORIGIN, bytes32(uint256(uint160(address(sender)))), "hello");
        destinationMailbox.processNextInboundMessage();
    }

    function test_untrustedSenderIsRejected() public {
        Sender other = new Sender(address(originMailbox));
        other.send(DESTINATION, address(receiver), "spoof");

        vm.expectRevert("untrusted sender");
        destinationMailbox.processNextInboundMessage();
    }
}
```

```text
[PASS] test_messageIsDelivered()
[PASS] test_untrustedSenderIsRejected()
```

## MockMailbox API

| Function                                               | Does                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `new MockMailbox(uint32 domain)`                       | A Mailbox for `domain`, with an accept-all ISM and a zero-fee hook |
| `addRemoteMailbox(uint32 domain, MockMailbox mailbox)` | Where messages to `domain` go                                      |
| `processNextInboundMessage()`                          | Deliver the oldest undelivered inbound message                     |
| `processInboundMessage(uint32 nonce)`                  | Deliver a specific one                                             |

`MockMailbox` checks no signatures. Test your own security assumptions (trusted origins and senders, as above) in your recipient, not in the mock.
