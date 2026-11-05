# @recoillink/sdk

The TypeScript SDK for [Recoil Link](https://github.com/recoil-labs/recoil-link): send cross-chain messages, quote fees and wait for delivery.

## Install

```bash
npm install @recoillink/sdk @recoillink/utils ethers@5
```

Needs Node.js 22+.

## Send a message

```ts
import { HyperlaneCore, MultiProvider } from '@recoillink/sdk';

// multiProvider: chain metadata and a signer for the origin chain
const core = HyperlaneCore.fromAddressesMap(
  {
    sepolia: { mailbox: '0xA066332EF9C28158BDCf45D1a6138219e86CB6c6' },
    basesepolia: { mailbox: '0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20' },
  },
  multiProvider,
);
const { dispatchTx } = await core.sendMessage(
  'sepolia',
  'basesepolia',
  recipient,
  body,
);
await core.waitForMessageProcessed(dispatchTx);
```

Class names such as `HyperlaneCore` are kept from the upstream code so existing integrations keep working. A complete, runnable example is in the [examples repository](https://github.com/recoil-labs/recoil-link-examples).

## Status

Recoil Link is on **testnet** (Sepolia, Base Sepolia, OP Sepolia, BSC testnet), secured by one validator. Don't move real value with it yet.

## Links

- [Recoil Link on GitHub](https://github.com/recoil-labs/recoil-link)
- [Documentation](https://github.com/recoil-labs/recoil-link/tree/main/docs-site/docs)
- [Examples](https://github.com/recoil-labs/recoil-link-examples)

## License

Apache-2.0. Recoil Link is built on [Hyperlane](https://github.com/hyperlane-xyz/hyperlane-monorepo); see the repository's NOTICE.
