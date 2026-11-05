# Recoil Link OIF oracle

`RecoilLinkOracle` lets [Open Intents Framework](https://github.com/openintentsframework/oif-contracts) settlers prove cross-chain fills over Recoil Link. It replaces development-only oracles such as `AlwaysYesOracle`, which approve every claim.

It is OIF's `HyperlaneOracle` with no added logic. Recoil Link keeps the Mailbox interface and message format, so the upstream oracle works unchanged and OIF solvers (including RecoilPay's) talk to it through the same ABI.

## How a fill is proven

1. A solver fills an order on the **output chain** through an OIF output settler.
2. Anyone calls `submit` on that chain's `RecoilLinkOracle`, paying the Recoil Link gas quote (`quoteGasPayment`). It checks the fill with the settler and dispatches the fill description through the Recoil Link Mailbox.
3. Recoil Link validators sign the message and the relayer delivers it to the **input chain**.
4. The input chain's `RecoilLinkOracle` records the fill, keyed by the sending oracle and the settler. The escrow releases the solver's payment once `isProven` / `efficientRequireProven` passes.

A proof only counts if it came from the oracle the order named: anyone can send messages through the Mailbox, but those are recorded under the sender's own identity.

## Deployments (testnet)

| Chain        | Domain   | RecoilLinkOracle                             | Mailbox                                      |
| ------------ | -------- | -------------------------------------------- | -------------------------------------------- |
| Sepolia      | 11155111 | `0x758759C9Ac7199629E965a5a2fE73eAa0Ba8ae8D` | `0xA066332EF9C28158BDCf45D1a6138219e86CB6c6` |
| Base Sepolia | 84532    | `0xff10Fddc92192c9770E4E4085D96F45Ee60dF55c` | `0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20` |
| OP Sepolia   | 11155420 | `0x1a773548711e6Ccd40CF81CC2DBA778f54aC4101` | `0x0B10f22CDF275293f7B4a995699440B04799c3bC` |
| BSC testnet  | 97       | `0xaa3e0A9DCF6c0d6b1E3Dcb9ed61601cAC0CEa525` | `0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893` |
| Polygon Amoy | 80002    | `0xb55E5Fa76eef2632f7e0f0249b9f6a5c30090BfA` | `0xa526198d90Cc17007fDD5Fe2fF21a657f04E4ff5` |

Live check: `scripts/recoil-link/testnet/oracle-proof-test.sh` fills 1 test USDC on Base Sepolia through RecoilPay's OIF output settler and waits until Sepolia's oracle reports it proven (first run 2026-10-30: proven 44 s after submit).

## Layout

| Path                          | What                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `src/RecoilLinkOracle.sol`    | The oracle (wrapper around OIF `HyperlaneOracle`)                     |
| `test/RecoilLinkOracle.t.sol` | End-to-end tests against Recoil Link's real `Mailbox` (`../solidity`) |
| `script/Deploy.s.sol`         | Deploys an oracle against the chain's Recoil Link Mailbox             |
| `lib/oif-contracts`           | OIF, git submodule pinned to `8e38b9b` (MIT)                          |

## Setup and tests

Needs the Solidity dependencies of `../solidity` (`forge soldeer install` there) and the OIF submodule:

```sh
git submodule update --init oif-oracle/lib/oif-contracts
git -C oif-oracle/lib/oif-contracts submodule update --init lib/openzeppelin-contracts
cd oif-oracle && forge test
```

## Deploy

```sh
oif-oracle/deploy.sh sepolia
oif-oracle/deploy.sh basesepolia
```

`deploy.sh` uses `forge create`, so the gas limit comes from the chain. Avoid `forge script ... --broadcast` for deployments: it sizes gas from a local simulation, and on chains that repriced contract creation (Sepolia needs ~6.2M gas where the simulation says ~0.8M) the transaction runs out of gas. `script/Deploy.s.sol` remains useful for dry runs (`--fork-url`, no `--broadcast`).

Deploy one oracle per chain. Domain ids must equal chain ids (true for every EVM chain in the Recoil Link registry); routes to chains with different domain ids (e.g. Solana) use OIF's `HyperlaneOracleMapped`.
