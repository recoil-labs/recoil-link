---
title: Contracts
---

# Contracts

The contracts an app touches. Sources are in [`solidity/contracts`](https://github.com/recoil-labs/recoil-link/tree/main/solidity/contracts).

## Mailbox (`IMailbox`)

One per chain; the only contract most apps call.

| Function                                                                                                | Use                                                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `dispatch(uint32 destinationDomain, bytes32 recipient, bytes body) payable returns (bytes32 messageId)` | Send a message with default hook metadata              |
| `dispatch(uint32, bytes32, bytes body, bytes hookMetadata) payable returns (bytes32)`                   | Send with hook metadata (e.g. a gas limit)             |
| `quoteDispatch(uint32, bytes32, bytes body) view returns (uint256 fee)`                                 | Fee for the above                                      |
| `quoteDispatch(uint32, bytes32, bytes body, bytes hookMetadata) view returns (uint256)`                 | Fee with metadata                                      |
| `delivered(bytes32 messageId) view returns (bool)`                                                      | Destination: was the message handled?                  |
| `processedAt(bytes32 messageId) view returns (uint48)`                                                  | Destination: block number it was handled in (0 if not) |
| `latestDispatchedId() view returns (bytes32)`                                                           | Origin: id of the last dispatched message              |
| `localDomain() view returns (uint32)`                                                                   | This chain's domain id                                 |
| `defaultIsm()`, `defaultHook()`, `requiredHook()`                                                       | The Mailbox's defaults                                 |

Events: `Dispatch(address sender, uint32 destination, bytes32 recipient, bytes message)` and `DispatchId(bytes32 messageId)` on the origin; `Process(uint32 origin, bytes32 sender, address recipient)` and `ProcessId(bytes32 messageId)` on the destination.

## Message recipient (`IMessageRecipient`)

```solidity
function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable;
```

Optionally, to pick a security module other than the Mailbox default:

```solidity
function interchainSecurityModule() external view returns (IInterchainSecurityModule);
```

## Interchain gas paymaster

| Function                                                                             | Use                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `quoteGasPayment(uint32 destinationDomain, uint256 gasLimit) view returns (uint256)` | Price of `gasLimit` gas on the destination, in this chain's native token |
| `destinationGasOverhead(uint32 destinationDomain) view returns (uint256)`            | Fixed overhead added to every gas limit                                  |

The paymaster collects payments during `dispatch`; apps do not usually call it directly.

## RecoilLinkOracle

OIF oracle; see [Prove intent fills](../build/prove-intent-fills.md). Main functions: `submit`, `quoteGasPayment` (output chain) and `isProven`, `efficientRequireProven` (input chain).

## Compatibility

All of these keep Hyperlane's interfaces and ABIs, so Hyperlane tooling and interface packages work against Recoil Link's addresses.
