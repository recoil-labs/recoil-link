---
title: Solidity libraries
---

# Solidity libraries

Helpers from Recoil Link's contracts that save writing the same checks in every app. They come with the Solidity package, `@recoillink/core` (see [Testing](./testing.md#getting-the-contracts) for installing it).

## MailboxClient

Base contract for anything that talks to a Mailbox.

```solidity
import {MailboxClient} from "@recoillink/core/contracts/client/MailboxClient.sol";
```

| Member                                                               |                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `mailbox`                                                            | The Mailbox (immutable, set in the constructor)                                                 |
| `localDomain`                                                        | This chain's domain id                                                                          |
| `onlyMailbox` modifier                                               | Rejects calls not coming from the Mailbox: use it on `handle`                                   |
| `hook`, `setHook(address)`                                           | Optional custom post-dispatch hook (owner only)                                                 |
| `interchainSecurityModule()`, `setInterchainSecurityModule(address)` | Optional custom ISM for messages to this contract (owner only); unset means the Mailbox default |

`MailboxClient` is upgradeable-ready (`OwnableUpgradeable`); call `_MailboxClient_initialize(hook, ism, owner)` from your initializer.

## Router

`MailboxClient` plus a table of trusted remote contracts ("routers"), one per domain. Incoming messages from anything else are rejected before your code runs.

```solidity
import {Router} from "@recoillink/core/contracts/client/Router.sol";
```

| Member                                                                           |                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `enrollRemoteRouter(uint32 domain, bytes32 router)` / `enrollRemoteRouters(...)` | Trust a contract on another domain (owner only)                 |
| `routers(uint32 domain)`, `domains()`                                            | The table                                                       |
| `_handle(uint32 origin, bytes32 sender, bytes calldata message)`                 | Override this: called only for messages from an enrolled router |
| `_Router_dispatch(...)`                                                          | Dispatch to the enrolled router on a domain                     |

Use `Router` when the same app is deployed on several chains and only its own instances may talk to each other.

## TypeCasts

```solidity
import {TypeCasts} from "@recoillink/core/contracts/libs/TypeCasts.sol";

bytes32 recipient = TypeCasts.addressToBytes32(recipientAddress);
address sender = TypeCasts.bytes32ToAddress(senderBytes32);
```

## Message

Parses the packed [message](../reference/message-format.md) (useful in custom ISMs and hooks):

`id`, `version`, `nonce`, `origin`, `sender`, `senderAddress`, `destination`, `recipient`, `recipientAddress`, `body`, and `formatMessage` to build one.

## StandardHookMetadata

Builds and reads the metadata passed to `dispatch` (see [Gas and fees](./gas-and-fees.md#setting-a-gas-limit)):

| Function                                                            |                                                                |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `overrideGasLimit(uint256)`                                         | Metadata asking the gas paymaster to charge for this gas limit |
| `overrideRefundAddress(address)`                                    | Where overpayment goes                                         |
| `overrideMsgValue(uint256)`                                         | Native value to forward on delivery                            |
| `formatMetadata(msgValue, gasLimit, refundAddress, customMetadata)` | All fields at once                                             |
| `gasLimit`, `refundAddress`, `msgValue`, `variant`                  | Read them back                                                 |

```solidity
import {StandardHookMetadata} from "@recoillink/core/contracts/hooks/libs/StandardHookMetadata.sol";

bytes memory metadata = StandardHookMetadata.overrideGasLimit(200_000);
uint256 fee = mailbox.quoteDispatch(destination, recipient, body, metadata);
mailbox.dispatch{value: fee}(destination, recipient, body, metadata);
```

`overrideGasLimit` sets the refund address to `msg.sender`, i.e. the contract calling it.
