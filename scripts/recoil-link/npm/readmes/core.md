# @recoillink/core

Solidity contracts and interfaces for [Recoil Link](https://github.com/recoil-labs/recoil-link): cross-chain messaging with proof. Includes the Mailbox, security modules (ISMs), hooks, `MockMailbox` for tests, and TypeChain bindings.

## Install

```bash
npm install @recoillink/core
```

```solidity
import {IMailbox} from "@recoillink/core/contracts/interfaces/IMailbox.sol";
import {IMessageRecipient} from "@recoillink/core/contracts/interfaces/IMessageRecipient.sol";
```

The contracts import OpenZeppelin 4.9.3, which this package bundles under `dependencies/`.

**Foundry:** add to `remappings.txt`:

```text
@recoillink/core/=node_modules/@recoillink/core/
@openzeppelin/contracts/=node_modules/@recoillink/core/dependencies/@openzeppelin-contracts-4.9.3/contracts/
@openzeppelin/contracts-upgradeable/=node_modules/@recoillink/core/dependencies/@openzeppelin-contracts-upgradeable-4.9.3/contracts/
forge-std/=node_modules/@recoillink/core/dependencies/forge-std-1.9.2/src/
```

**Hardhat:** `npm install @openzeppelin/contracts@4.9.3 @openzeppelin/contracts-upgradeable@4.9.3`.

Contract addresses for each network are in the [Recoil Link registry](https://github.com/recoil-labs/recoil-link-registry).

## Status

Recoil Link is on **testnet** (Sepolia, Base Sepolia, OP Sepolia, BSC testnet), secured by one validator. Don't move real value with it yet.

## Links

- [Recoil Link on GitHub](https://github.com/recoil-labs/recoil-link)
- [Documentation](https://github.com/recoil-labs/recoil-link/tree/main/docs-site/docs)
- [Examples](https://github.com/recoil-labs/recoil-link-examples)

## License

Apache-2.0. Recoil Link is built on [Hyperlane](https://github.com/hyperlane-xyz/hyperlane-monorepo); see the repository's NOTICE.
