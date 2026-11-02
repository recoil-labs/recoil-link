---
title: TypeScript SDK
---

# TypeScript SDK

`@recoillink/sdk` sends and tracks messages from TypeScript: a backend, a script or a test. It needs Node.js 22+.

```bash
npm install @recoillink/sdk @recoillink/utils ethers@5
```

The SDK uses ethers v5.

## Send a message and wait for delivery

This sends a message from Sepolia to Base Sepolia's test recipient (a contract that accepts any message), then waits until the relayer has delivered it:

```ts title="send.mjs"
import { Wallet } from 'ethers';
import { HyperlaneCore, MultiProvider } from '@recoillink/sdk';
import { ProtocolType } from '@recoillink/utils';

const multiProvider = new MultiProvider({
  sepolia: {
    name: 'sepolia',
    chainId: 11155111,
    domainId: 11155111,
    protocol: ProtocolType.Ethereum,
    rpcUrls: [{ http: 'https://ethereum-sepolia.publicnode.com' }],
  },
  basesepolia: {
    name: 'basesepolia',
    chainId: 84532,
    domainId: 84532,
    protocol: ProtocolType.Ethereum,
    rpcUrls: [{ http: 'https://sepolia.base.org' }],
  },
});
multiProvider.setSharedSigner(new Wallet(process.env.HYP_KEY));

const core = HyperlaneCore.fromAddressesMap(
  {
    sepolia: { mailbox: '0xA066332EF9C28158BDCf45D1a6138219e86CB6c6' },
    basesepolia: { mailbox: '0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20' },
  },
  multiProvider,
);

// Base Sepolia's test recipient: accepts any message.
const recipient = '0xb0CaE038F60Bb9eb5A127A062E908497d50c4bD9';
const body = '0x' + Buffer.from('hello from Sepolia').toString('hex');

// sendMessage quotes the fee and pays it.
const { dispatchTx, message } = await core.sendMessage(
  'sepolia',
  'basesepolia',
  recipient,
  body,
);
console.log('message id:', message.id);

// Poll the destination Mailbox until the relayer has delivered it.
await core.waitForMessageProcessed(dispatchTx, 5_000, 60);
console.log('delivered on Base Sepolia');
```

```bash
read -s "HYP_KEY?Private key: " && export HYP_KEY
node send.mjs
```

On testnet, delivery from Sepolia usually takes under a minute. To send to your own contract, replace `recipient` with its address; it must implement `handle` ([Receive messages](./receive-messages.md)). Take Mailbox addresses for other chains from [Networks](../reference/networks.md).

## Useful methods

| Method on `HyperlaneCore`                                                   | Does                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `quoteGasPayment(origin, destination, recipientBytes32, body)`              | The fee `dispatch` charges, in the origin's native token (wei)              |
| `sendMessage(origin, destination, recipient, body)`                         | Quote, pay and dispatch; returns the receipt and the message                |
| `waitForMessageProcessed(dispatchReceipt, delayMs?, maxAttempts?)`          | Resolves when every message in the transaction is delivered                 |
| `waitForMessageIdProcessed(messageId, destination, delayMs?, maxAttempts?)` | The same, for one message id                                                |
| `HyperlaneCore.getDispatchedMessages(receipt)`                              | Decodes the messages a transaction dispatched (id, sender, recipient, body) |

`quoteGasPayment` takes the recipient as `bytes32`: convert an address with `addressToBytes32` from `@recoillink/utils`.

The class names (`HyperlaneCore`, `MultiProvider`) are the same as in Hyperlane's SDK, which Recoil Link's is built from.
