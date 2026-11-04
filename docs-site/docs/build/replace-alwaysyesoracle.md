---
title: Replace AlwaysYesOracle
---

# Replace AlwaysYesOracle with RecoilLinkOracle

`AlwaysYesOracle` approves every claim, so an escrow using it pays a solver whether or not the fill happened. Moving an Open Intents Framework (OIF) deployment to `RecoilLinkOracle` takes three changes: name Recoil Link oracles in your orders, have solvers prove each fill before claiming, and give orders enough time for the proof. Settlers and escrows stay as they are.

[RecoilPay](../use-cases/recoilpay.md) made this change for its routes between Recoil Link networks; its proofs arrive 10 seconds to about a minute after a fill. How the oracle works is on [Prove intent fills](./prove-intent-fills.md); this page is the migration.

## 1. Check what your orders use

An order's `inputOracle` decides whether the escrow needs proof. Ask it about a fill that cannot exist:

```bash
Z=$(cast to-uint256 0)   # 32 zero bytes
cast call --rpc-url <input chain RPC> <inputOracle> \
  'isProven(uint256,bytes32,bytes32,bytes32)(bool)' 0 $Z $Z $Z
```

`true` means it approves everything: an `AlwaysYesOracle`. A real oracle, including `RecoilLinkOracle`, answers `false`. Solvers can run the same probe on each order's input oracle to tell which orders need a proof, so one solver handles both kinds during the move.

## 2. Name Recoil Link oracles in new orders

| Order field         | Set it to                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `inputOracle`       | The input chain's `RecoilLinkOracle`                                                     |
| `outputs[i].oracle` | The output chain's `RecoilLinkOracle`, as `bytes32` (the address left-padded with zeros) |

Addresses are on [Networks](../reference/networks.md). Use Recoil Link oracles on **both** chains of a route or on neither: a proof can only travel from the output chain's oracle to the input chain's.

Nothing else in the order changes. The output settler attests a fill to whichever oracle the output names, and the input escrow checks whichever oracle the order names.

## 3. Prove each fill before claiming

After the fill lands on the output chain, the solver (or anyone) proves it and then finalises as before.

**Build one fill description per output.** OIF's `MandateOutputEncodingLib.encodeFillDescription` packs:

```text
solver (bytes32) · orderId (bytes32) · timestamp (uint32) · token (bytes32) · amount (uint256)
· recipient (bytes32) · uint16 length + callbackData · uint16 length + context
```

`timestamp` is the timestamp of the **block the fill landed in**, not the time you send the proof.

**Quote and submit** on the output chain's oracle, passing the output settler as `source`:

```solidity
uint256 fee = outputOracle.quoteGasPayment(
    inputChainId, address(inputOracle), gasLimit, "", outputSettler, payloads);
outputOracle.submit{value: fee}(
    inputChainId, address(inputOracle), gasLimit, "", outputSettler, payloads);
```

- `inputChainId` is the input chain's domain id, which equals its chain id on every network Recoil Link supports.
- `gasLimit` is the gas you pay the relayer to deliver the proof to the input oracle. **300,000** covers up to two fill descriptions; one was proven within 200,000 on Sepolia.
- Overpayment is refunded to whoever called `submit`.
- `submit` reverts with `NotAllPayloadsValid()` unless the settler has recorded every fill exactly as described.

**Wait for the proof** on the input chain, polling every 10 seconds or so:

```solidity
bool proven = inputOracle.isProven(
    outputChainId,
    bytes32(uint256(uint160(address(outputOracle)))),
    bytes32(uint256(uint160(outputSettler))),
    keccak256(payload));
```

Then call `finalise` on the escrow as you do today; it checks the same proof with `efficientRequireProven`.

[`oracle-proof-test.sh`](https://github.com/recoil-labs/recoil-link/blob/main/scripts/recoil-link/testnet/oracle-proof-test.sh) runs these steps end to end on testnet with `cast`: a real fill on Base Sepolia proven on Sepolia.

## 4. Give orders time

A refund before the proof lands leaves the solver unpaid for a fill it already made. RecoilPay's rules on Recoil Link routes:

| Rule                                 | Value                                  |
| ------------------------------------ | -------------------------------------- |
| Order expiry                         | 30 minutes                             |
| Solvers refuse orders with less than | 20 minutes left                        |
| Solvers wait for a proof for up to   | 30 minutes, then retry the claim later |

Proofs normally arrive within a minute; the margin covers a relayer outage.

## 5. Roll out

1. Deploy nothing: `RecoilLinkOracle` is already on every [supported network](../reference/networks.md). To run your own instead, see [`oif-oracle/`](https://github.com/recoil-labs/recoil-link/tree/main/oif-oracle).
2. Update solvers first, so they prove fills whenever the probe in step 1 says an order needs it.
3. Switch new orders to Recoil Link oracles, one route at a time.
4. Leave open orders alone. Orders created with `AlwaysYesOracle` keep it and finalise as before; nothing in escrow needs migrating.

## Troubleshooting

| Symptom                                       | Likely cause                                                                                                                    | Fix                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `submit` reverts with `NotAllPayloadsValid()` | A field in the fill description differs from the fill (most often the timestamp), or `source` is not the settler that filled    | Rebuild the payload from the fill's own block; check `hasAttested` with an `eth_call` **from the output oracle's address**                      |
| Proof never arrives                           | No fee was sent with `submit`, or the delivery is failing on the input chain                                                    | Check delivery with `rlink status --origin <output chain> --dispatchTx <submit tx>`; see [Message debugging](../resources/message-debugging.md) |
| Delivered but `isProven` is `false`           | Wrong lookup: `remoteOracle` must be the **output** oracle and `application` the **output settler**, with the output chain's id | Re-check the four `isProven` arguments                                                                                                          |
| `finalise` reverts after the proof            | The order names a different oracle than the one that sent the proof, or the order already expired                               | Compare the order's oracles with the ones you used; check expiry                                                                                |
