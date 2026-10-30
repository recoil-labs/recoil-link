# Recoil Link OIF oracle

`RecoilLinkOracle` lets [Open Intents Framework](https://github.com/openintentsframework/oif-contracts) settlers prove cross-chain fills over Recoil Link. It replaces development-only oracles such as `AlwaysYesOracle`, which approve every claim.

It is OIF's `HyperlaneOracle` with no added logic. Recoil Link keeps the Mailbox interface and message format, so the upstream oracle works unchanged and OIF solvers (including RecoilPay's) talk to it through the same ABI.

## How a fill is proven

1. A solver fills an order on the **output chain** through an OIF output settler.
2. Anyone calls `submit` on that chain's `RecoilLinkOracle`, paying the Recoil Link gas quote (`quoteGasPayment`). It checks the fill with the settler and dispatches the fill description through the Recoil Link Mailbox.
3. Recoil Link validators sign the message and the relayer delivers it to the **input chain**.
4. The input chain's `RecoilLinkOracle` records the fill, keyed by the sending oracle and the settler. The escrow releases the solver's payment once `isProven` / `efficientRequireProven` passes.

A proof only counts if it came from the oracle the order named: anyone can send messages through the Mailbox, but those are recorded under the sender's own identity.

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
cd oif-oracle
forge script script/Deploy.s.sol --rpc-url <rpc> --private-key <key> --broadcast
```

Deploy one oracle per chain. Domain ids must equal chain ids (true for every EVM chain in the Recoil Link registry); routes to chains with different domain ids (e.g. Solana) use OIF's `HyperlaneOracleMapped`.
