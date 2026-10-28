# Recoil Link

Recoil Link is Recoil Labs' interchain messaging protocol: a fork of the Hyperlane monorepo (Apache-2.0). It replaces Hyperlane inside RecoilPay (https://v2.recoilpay.com/) and is offered to outside developers, who pay Recoil Labs to use it.

Upstream engineering guidance (build, test, architecture) is in AGENTS.md and still applies. Where it says "Hyperlane", read "Recoil Link" for user-facing things:

@AGENTS.md

## Fork rules

- `upstream` remote = hyperlane-xyz/hyperlane-monorepo, `origin` = recoil-labs/recoil-link (private until the audit).
- **Keep the diff against upstream small** so Hyperlane security fixes can be merged. Rename only user-facing surfaces; keep internal names (`Mailbox`, `HyperlaneCore`, Rust crate names, Solidity contracts).
- Mechanical renames live in `scripts/recoil-link/rebrand.sh` (idempotent). Upstream sync: `git fetch upstream && git merge upstream/main`, then re-run the script, then `pnpm install`.
- npm scope `@recoillink/*`; CLI command `rlink`; local registry dir `~/.recoil-link`.
- `@hyperlane-xyz/registry` is an external package we still consume; the default registry URL is `RECOIL_LINK_REGISTRY_URL` (`typescript/sdk/src/consts/registry.ts`) → recoil-labs/recoil-link-registry. Never default to Hyperlane's registry or deployments.
- That registry package imports `@hyperlane-xyz/sdk` and `@hyperlane-xyz/utils` (types and runtime). Root `package.json` aliases those names to our workspace packages (`workspace:@recoillink/...`). Don't remove the aliases until we ship our own `@recoillink/registry`.
- Keep every upstream VM (EVM, Sealevel/Solana, Cosmos, Starknet, Aleo, Radix, Tron). Do not delete them.
- Skills under `.agents/skills/` and `typescript/infra` describe Hyperlane's own operations (their GCP, Linear, Safes, keys). Do not run them against Recoil Link until they are adapted.

## Revenue

ProtocolFee hook (`solidity/contracts/hooks/ProtocolFee.sol`, Sealevel `hyperlane-sealevel-fee`), a margin on interchain gas payments (IGP), Warp Route fees, and Recoil-run relayers. Fee beneficiaries go to a Recoil Labs multisig.

## Roadmap

0. Fork + rebrand (done on `rebrand/recoil-link`; lockfile regen + build check pending)
1. Fees on, Recoil registry repo, EVM + Solana testnets, own validators/relayers, explorer; adapt `typescript/infra`
2. Migrate RecoilPay off Hyperlane (Warp Route collateral migration is the riskiest step)
3. Audits + bug bounty, then public launch
4. Move support: shared Move core + Aptos-family adapter (Aptos, Movement, Supra, Initia)
5. Sui-family adapter (Sui, IOTA)
