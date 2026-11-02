---
title: Gas and fees
---

# Gas and fees

A sender pays once, on the origin chain, in its native token. `quoteDispatch` tells you how much.

## What the fee covers

| Part                                                                                                                                                           | Paid to                        | Today                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Destination gas** for the relayer to deliver: your `handle` gas limit plus a fixed verification overhead (151,966 gas with the current 1-of-1 validator set) | Interchain gas paymaster (IGP) | Destination gas price × exchange rate × **1.3** (30% margin), with a minimum per message on mainnet |
| **Protocol fee**                                                                                                                                               | Protocol fee hook              | **0**                                                                                               |

Fees are collected by the Recoil Labs treasury. The relayer only delivers messages that prepaid gas through the IGP.

## Setting a gas limit

By default the IGP charges for **50,000 gas** of `handle` execution. If your recipient needs more, say so in the hook metadata. Use the four-argument `dispatch` and `quoteDispatch`:

```solidity
interface IMailbox {
    function dispatch(uint32 destinationDomain, bytes32 recipientAddress, bytes calldata body, bytes calldata hookMetadata)
        external payable returns (bytes32 messageId);

    function quoteDispatch(uint32 destinationDomain, bytes32 recipientAddress, bytes calldata body, bytes calldata hookMetadata)
        external view returns (uint256 fee);
}

// Standard hook metadata, variant 1: msgValue, gasLimit, refundAddress.
function gasLimitMetadata(uint256 gasLimit, address refundAddress) pure returns (bytes memory) {
    return abi.encodePacked(uint16(1), uint256(0), gasLimit, refundAddress);
}

// in your sender:
bytes memory metadata = gasLimitMetadata(200_000, address(this));
uint256 fee = mailbox.quoteDispatch(destination, to, body, metadata);
mailbox.dispatch{value: fee}(destination, to, body, metadata);
```

Pay for the gas your `handle` actually needs. On testnet the relayer currently delivers any message that prepaid at least a minimum and estimates the gas itself, but Recoil Labs may require payments to cover the full delivery cost on mainnet, after which underpaid messages are delayed or not delivered. If delivery reverts (for example `handle` itself reverts), the relayer retries with backoff.

## Checking a quote off-chain

```bash
cast call --rpc-url https://ethereum-sepolia.publicnode.com \
  0x5d7A0bD0a19f6e104d74EBcB660218D0DfA43Cc3 \
  'quoteGasPayment(uint32,uint256)(uint256)' 84532 200000
```

That asks Sepolia's IGP what 200,000 gas of delivery to Base Sepolia (domain `84532`) costs, in wei.

## Testnet pricing

Testnet gas oracles are set at deploy time and not updated continuously. Some routes are priced deliberately cheap so that proofs cost little in faucet tokens (for example, Ethereum-testnet gas quoted from BSC testnet). On mainnet a price updater keeps every route at real prices plus the margin.
