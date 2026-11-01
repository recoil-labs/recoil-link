---
title: Networks and addresses
---

# Networks and addresses

Recoil Link is live on these **testnets**. Every pair delivers messages in both directions. The canonical source is the [Recoil Link registry](https://github.com/recoil-labs/recoil-link-registry) (`chains/<name>/addresses.yaml`); this page mirrors it.

| Network      | Registry name     | Domain id  | Native token |
| ------------ | ----------------- | ---------- | ------------ |
| Sepolia      | `sepolia`         | `11155111` | ETH          |
| Base Sepolia | `basesepolia`     | `84532`    | ETH          |
| OP Sepolia   | `optimismsepolia` | `11155420` | ETH          |
| BSC testnet  | `bsctestnet`      | `97`       | BNB          |

Domain ids equal chain ids on all of them.

:::caution Addresses repeat across chains
Recoil Link's contracts were deployed from one wallet, so the same address can belong to **different** contracts on different chains (for example `0x7f34…8893` is OP Sepolia's gas paymaster and BSC testnet's Mailbox). Always look addresses up per chain.
:::

## Sepolia (`11155111`)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| Mailbox                    | `0xA066332EF9C28158BDCf45D1a6138219e86CB6c6` |
| Interchain gas paymaster   | `0x5d7A0bD0a19f6e104d74EBcB660218D0DfA43Cc3` |
| Merkle tree hook           | `0x988179ce9981Cc728435af030E26930Ac3D5dCE0` |
| Validator announce         | `0x6fC44902bDFFb0a27c228082E1bB3D0cCb6ce996` |
| RecoilLinkOracle (OIF)     | `0x758759C9Ac7199629E965a5a2fE73eAa0Ba8ae8D` |
| Test recipient             | `0xEe2d17ba26B2D416577Fa1FeC8DB0642e8bADc5D` |
| Storage gas oracle         | `0xD1F3ab24A45e515B3A044180062FDF29E2972ac7` |
| Proxy admin                | `0x3E77C86FbdEbD23cB42945F3Ed0121a0fAD9A013` |
| Interchain account router¹ | `0xDa5BBbF7469F342EF71E2dDb7326dcfDed4C3D28` |

## Base Sepolia (`84532`)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| Mailbox                    | `0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20` |
| Interchain gas paymaster   | `0x0d267364B1C197A158B5B37Ec370405c4fc90eb9` |
| Merkle tree hook           | `0x9F1E575B3cB3C4cc40aB599EC93Da7564454E42b` |
| Validator announce         | `0x4E8Eed986ad73e6EE4273244fa65714D03F7F69F` |
| RecoilLinkOracle (OIF)     | `0xff10Fddc92192c9770E4E4085D96F45Ee60dF55c` |
| Test recipient             | `0xb0CaE038F60Bb9eb5A127A062E908497d50c4bD9` |
| Storage gas oracle         | `0xFec2c19b6e3B9d3c50c2dab3fF2e99881c4D6583` |
| Proxy admin                | `0x9Eaf1e88a6E75447ce085c6e6765696A7e9e7809` |
| Interchain account router¹ | `0x006ca4627213d8174A6101E1F847f76E42e755bA` |

## OP Sepolia (`11155420`)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| Mailbox                    | `0x0B10f22CDF275293f7B4a995699440B04799c3bC` |
| Interchain gas paymaster   | `0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893` |
| Merkle tree hook           | `0x1004D0e327701982Aed481a35e3475eA9b00A989` |
| Validator announce         | `0x60450376483e407E81e70Ac0621Ce3eeAAcf2CD2` |
| RecoilLinkOracle (OIF)     | `0x1a773548711e6Ccd40CF81CC2DBA778f54aC4101` |
| Test recipient             | `0x28cB9aFa052f87a9d79CC5A397cC42bc2E23b587` |
| Storage gas oracle         | `0x374600f848aC5A7df7c04bEE6Ecf5C70745948ba` |
| Proxy admin                | `0x281F476AB8b55D6C546A01D595A3739Eba5f86c2` |
| Interchain account router¹ | `0xe784a4a9de1f822E836B7Ccc13bd70ba03fdA258` |

## BSC testnet (`97`)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| Mailbox                    | `0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893` |
| Interchain gas paymaster   | `0x8d823A965F44379819230F056DDF95b59f4960dc` |
| Merkle tree hook           | `0x8Efb7cBCd6CfF0Cfc4E73f1f93a810517404d5E3` |
| Validator announce         | `0xD60fcEe08Bd41dA79A4135D27e2BDf78c065A577` |
| RecoilLinkOracle (OIF)     | `0xaa3e0A9DCF6c0d6b1E3Dcb9ed61601cAC0CEa525` |
| Test recipient             | `0xCDbeb2c4BFC21f5340194dDF1EedC45BF3bD4c7D` |
| Storage gas oracle         | `0xd60960B2591cC6b4F1984D1CBcC753C105e45cf3` |
| Proxy admin                | `0x4F08c338a51BbEc901db4b69F7453fc2ad1Db15c` |
| Interchain account router¹ | `0x1a773548711e6Ccd40CF81CC2DBA778f54aC4101` |

¹ Interchain accounts are deployed but not yet connected across all four networks; not supported for apps yet.

## Ownership

On every network the Mailbox, its proxy admin, the protocol fee hook and the gas paymaster are owned by the Recoil Labs treasury Safe, `0x020BC752682191Fa9997B3307A8FC9710aeA3365` (same address on all four). The default ISM accepts messages signed by the Recoil Link validator `0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB`. See [Security](../operate/security.md).

## Planned

Polygon Amoy is configured and priced on every network above, and will be deployed next. Other VMs supported by the codebase (Solana and more) will follow.
