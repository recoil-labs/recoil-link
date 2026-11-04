# Recoil Link

Recoil Link is Recoil Labs' cross-chain **messaging and proof layer**: a fork of the Hyperlane monorepo (Apache-2.0). Its job is proving that something happened on another chain, chiefly as the OIF oracle for RecoilPay's intent fills (https://v2.recoilpay.com/), replacing Hyperlane and the testnet-only `AlwaysYesOracle`. Offered to outside developers, who pay Recoil Labs (gas margin) to use it.

Upstream engineering guidance (build, test, architecture) is in AGENTS.md and still applies. Where it says "Hyperlane", read "Recoil Link" for user-facing things:

@AGENTS.md

## Fork rules

- `upstream` remote = hyperlane-xyz/hyperlane-monorepo, `origin` = recoil-labs/recoil-link (private until the audit).
- **Keep the diff against upstream small** so Hyperlane security fixes can be merged. Rename only user-facing surfaces; keep internal names (`Mailbox`, `HyperlaneCore`, Rust crate names, Solidity contracts).
- Mechanical renames live in `scripts/recoil-link/rebrand.sh` (idempotent), which also runs `package-policy.mjs` (our package.json settings). Upstream sync: `scripts/recoil-link/sync-upstream.sh`, process in `docs/recoil-link/upstream-sync.md`. A hand edit to an upstream file must go in `scripts/recoil-link/protected-files.txt` (or into rebrand.sh / package-policy.mjs); `scripts/recoil-link/check-protected.sh` finds any that are missing.
- npm scope `@recoillink/*`; CLI command `rlink`; local registry dir `~/.recoil-link`.
- `@hyperlane-xyz/registry` is an external package we still consume; the default registry URL is `RECOIL_LINK_REGISTRY_URL` (`typescript/sdk/src/consts/registry.ts`) → recoil-labs/recoil-link-registry. Never default to Hyperlane's registry or deployments.
- That registry package imports `@hyperlane-xyz/sdk` and `@hyperlane-xyz/utils` (types and runtime). Root `package.json` aliases those names to our workspace packages (`workspace:@recoillink/...`). Don't remove the aliases until we ship our own `@recoillink/registry`.
- Keep every upstream VM (EVM, Sealevel/Solana, Cosmos, Starknet, Aleo, Radix, Tron). Do not delete them.
- Skills under `.agents/skills/` and `typescript/infra` describe Hyperlane's own operations (their GCP, Linear, Safes, keys). Do not run them against Recoil Link until they are adapted.

## Product scope

- **No token routes.** Warp-route code (`solidity/contracts/token`, Sealevel token programs, SDK `token`/`warp`, rebalancer, warp-monitor, warp-widget) stays in the tree only to keep upstream merges cheap. Never deploy it, publish it or build features on it. `rlink warp`/`xerc20` are unregistered in `typescript/cli/cli.ts`; `rebalancer` and `warp-widget` are `private`.
- The product is: Mailbox, ISMs, hooks/IGP, validators, relayer, and `oif-oracle/` (OIF oracle against our Mailbox).

## Revenue

Margin on interchain gas payments (IGP), collected by Recoil-run relayers; ProtocolFee hook (`solidity/contracts/hooks/ProtocolFee.sol`) is 0 at launch. Policy: `typescript/sdk/src/consts/recoilLinkFees.ts`. Fee beneficiaries go to a Recoil Labs multisig.

## Roadmap

0. Fork + rebrand (done on `rebrand/recoil-link`; lockfile regen + build check pending)
1. Fees on, Recoil registry repo, EVM + Solana testnets, own validators/relayers, explorer; adapt `typescript/infra`
2. Move RecoilPay's fill proofs to Recoil Link and replace `AlwaysYesOracle` (plan: `~/recoil-pay-v2/docs/recoil-link-migration.md`; drain Solana orders before cutover)
3. Audits + bug bounty, then public launch
4. Move support: shared Move core + Aptos-family adapter (Aptos, Movement, Supra, Initia)
5. Sui-family adapter (Sui, IOTA)
