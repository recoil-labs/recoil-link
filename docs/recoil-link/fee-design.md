# Recoil Link fee design

Status: decided 2026-10-28. Policy values live in `typescript/sdk/src/consts/recoilLinkFees.ts`.

## Summary

**Scope (2026-10-30):** Recoil Link is a messaging and proof layer. Token routes are not offered, so route fees are out of scope; revenue is the gas payment margin (and, later, the protocol fee).

Recoil Link can earn revenue with **no new smart contracts**: every mechanism below already exists in the forked code and has been audited upstream. The work is choosing the numbers, pointing fees at a Recoil Labs treasury, and running the off-chain pieces that turn gas payments into margin.

| Lever              | Where                                                                               | Who pays                          | Recoil earns                       | Status                                                  |
| ------------------ | ----------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| Gas payment margin | IGP (`InterchainGasPaymaster.sol`, Sealevel IGP program)                            | Every sender that wants relaying  | Quote minus actual destination gas | Contracts exist; needs our gas-oracle updater + relayer |
| Protocol fee       | `ProtocolFee.sol` as the Mailbox **required hook**; Sealevel Mailbox `protocol_fee` | Every message, cannot be bypassed | Flat fee per message               | Contracts exist; config only                            |

## How Hyperlane earns today (what we are copying)

- **Protocol fee: 0.** The CLI default is `protocolFee: 0`, `maxProtocolFee: 0.1` native token (`typescript/cli/src/config/hooks.ts:40`).
- **Gas margin: the real business.** Hyperlane's infra sets on-chain gas oracle prices with a **50% exchange-rate margin** and a **$0.20 minimum per message** ($0.50 to/from Solana) (`typescript/infra/src/config/gas-oracle.ts:101`, `:304`). Their relayer pays actual destination gas; the IGP beneficiary collects the difference.

## Mechanisms in detail

### 1. Gas payment margin (primary revenue)

- Mailbox `defaultHook` = aggregation of `MerkleTreeHook` + `InterchainGasPaymaster`.
- Quote = `gasLimit × gasPrice × tokenExchangeRate / 1e10`, where `gasPrice` and `tokenExchangeRate` per destination come from a `StorageGasOracle` the owner updates.
- Margin is applied off-chain when we write oracle values (inflate exchange rate by X%, enforce a USD floor).
- `IGP.claim()` sends the accumulated balance to `beneficiary` (permissionless trigger, fixed recipient).
- **Required off-chain pieces:** gas-oracle updater (adapt `typescript/infra/src/config/gas-oracle.ts`; prices via `gasCurrencyCoinGeckoId` already in our registry), relayer with gas payment enforcement (relays only paid messages), and key funder (`typescript/keyfunder`) to keep relayer wallets topped up.

### 2. Protocol fee

- `ProtocolFee` set as the Mailbox `requiredHook`: runs on **every** dispatch; apps cannot override it (only `defaultHook` is overridable).
- Flat amount in the chain's native token; owner can change it up to `MAX_PROTOCOL_FEE`, which is **immutable after deploy** (EVM) / set in the Mailbox account (Sealevel).
- Limitation: with `protocolFee > 0`, `ProtocolFee.supportsMetadata` rejects ERC20 fee-token payments, so senders must pay gas in native token.
- `collectProtocolFees()` sends the balance to `beneficiary`.

## Treasury and ownership

- **Now (testnet and early mainnet): one signer.** A Safe (EVM) / Squads (Solana) multisig with a single owner, the Recoil Labs founder wallet, threshold 1. It is as easy to use as a plain wallet.
- **Before going live: add signers.** Add owners and raise the threshold on the same Safe. The address does not change, so no contract needs a new owner or beneficiary. This is why we use a 1-of-1 Safe instead of a plain wallet address.
- The same Safe is **owner** (can change fees, beneficiaries, oracles) and **beneficiary** (receives fees) for now; split them when signers are added.
- **Gas oracle key**: separate hot key used by the price updater; can only set gas data, not move funds.
- Never use the deployer key as owner or beneficiary on mainnet.

## Launch configuration (decided)

| Parameter                  | Value                            | Constant                              | Rationale                                                |
| -------------------------- | -------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| Gas exchange-rate margin   | 30%                              | `RECOIL_LINK_IGP_MARGIN_PCT`          | Undercut Hyperlane's 50% while covering price volatility |
| Min USD per message        | $0.10                            | `RECOIL_LINK_MIN_USD_PER_MESSAGE`     | Hyperlane uses $0.20                                     |
| Min USD per message to SVM | $0.50                            | `RECOIL_LINK_MIN_USD_PER_SVM_MESSAGE` | Covers Solana rent                                       |
| Protocol fee               | 0                                | `RECOIL_LINK_PROTOCOL_FEE`            | Match Hyperlane on price; revenue from margin            |
| `maxProtocolFee`           | ~$1 in each chain's native token | `RECOIL_LINK_MAX_PROTOCOL_FEE_USD`    | Immutable on EVM: leaves room to switch the fee on later |

## Implementation work

Done:

- Fee policy constants in `typescript/sdk/src/consts/recoilLinkFees.ts`, exported from `@recoillink/sdk`.
- `rlink core init`: IGP margin defaults to 30%; protocol fee default from policy; fixed the max protocol fee help text (native token, not wei).
- `typescript/infra/src/config/gas-oracle.ts` (base for our price updater) uses the policy margin and minimums; its tests derive expectations from the margin.

Next:

1. Create the 1-of-1 treasury Safe on the testnets (Sepolia, Base Sepolia).
2. Testnet core deploy with ProtocolFee (required hook) + MerkleTree/IGP (default hook), owner and beneficiary = treasury Safe.
3. Verify a message pays IGP, relayer delivers it, and `claim()` pays the Safe.
4. Before mainnet: per-chain `maxProtocolFee` from live prices, price-updater service, relayer gas payment enforcement, add Safe signers, and a deployer/oracle key separate from the Safe signer (testnet reuses the signer wallet).
