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

With Foundry, map the import prefix to it in `remappings.txt`:

```text title="remappings.txt"
@recoillink/core/=node_modules/@recoillink/core/
```

`MockMailbox` is at `@recoillink/core/contracts/mock/MockMailbox.sol`. Hardhat resolves `node_modules` imports without a remapping.

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
