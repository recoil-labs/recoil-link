#!/usr/bin/env bash
# Live end-to-end test of RecoilLinkOracle: a real OIF fill on Base Sepolia is
# proven on Sepolia through the Recoil Link validator and relayer.
# Usage: scripts/recoil-link/testnet/oracle-proof-test.sh
#
# The deployer fills 1 test USDC to itself through RecoilPay's OIF output
# settler, so no funds leave the wallet beyond gas and the Recoil Link fee.
# Needs the validators and relayer running. Key: ~/.recoil-link/keys/testnet-deployer.
set -euo pipefail

BASE_RPC=https://sepolia.base.org
SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
SEPOLIA_DOMAIN=11155111
BASE_DOMAIN=84532
BASE_ORACLE=0xff10Fddc92192c9770E4E4085D96F45Ee60dF55c
SEPOLIA_ORACLE=0x758759C9Ac7199629E965a5a2fE73eAa0Ba8ae8D
SETTLER=0x9EF00F018b4afDCAa89093EF3015E6D918a58003 # RecoilPay's OIF output settler
TOKEN=0x73c83DAcc74bB8a704717AC09703b959E74b9705   # test USDC, 6 decimals
AMOUNT=1000000
GAS_LIMIT=200000

KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
[ -r "$KEY_FILE" ] || { echo "missing $KEY_FILE" >&2; exit 1; }
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
KEY="0x${KEY#0x}"
ME=$(cast wallet address --private-key "$KEY")

id() { printf '0x000000000000000000000000%s' "$(printf %s "${1#0x}" | tr '[:upper:]' '[:lower:]')"; }
hex32() { printf '%064x' "$1"; }

ORDER_ID=$(cast keccak "recoil-link-oracle-proof-test-$(date +%s)")
SOLVER_ID=$(id "$ME")
echo "order id: $ORDER_ID"

echo "1/4 fill $AMOUNT test USDC on Base Sepolia"
cast send --rpc-url "$BASE_RPC" --private-key "$KEY" "$TOKEN" 'approve(address,uint256)' "$SETTLER" "$AMOUNT" >/dev/null
FILL_TX=$(cast send --rpc-url "$BASE_RPC" --private-key "$KEY" --json "$SETTLER" \
  'fill(bytes32,(bytes32,bytes32,uint256,bytes32,uint256,bytes32,bytes,bytes),uint48,bytes)' \
  "$ORDER_ID" \
  "($(id $BASE_ORACLE),$(id $SETTLER),$BASE_DOMAIN,$(id $TOKEN),$AMOUNT,$(id $ME),0x,0x)" \
  281474976710655 "$SOLVER_ID" | jq -r .transactionHash)
FILL_BLOCK=$(cast receipt --rpc-url "$BASE_RPC" "$FILL_TX" blockNumber)
FILL_TIME=$(cast block --rpc-url "$BASE_RPC" "$FILL_BLOCK" -f timestamp)
echo "    fill tx $FILL_TX (block $FILL_BLOCK, time $FILL_TIME)"

# OIF fill description: abi.encodePacked(solver, orderId, uint32 timestamp, token,
# amount, recipient, uint16 0, callbackData, uint16 0, context).
PAYLOAD="0x${SOLVER_ID#0x}${ORDER_ID#0x}$(printf '%08x' "$FILL_TIME")$(id $TOKEN | cut -c3-)$(hex32 $AMOUNT)$(id $ME | cut -c3-)00000000"
# The settler attests a fill only to the oracle the output names, so ask as it.
ATTESTED=$(cast call --rpc-url "$BASE_RPC" --from "$BASE_ORACLE" "$SETTLER" 'hasAttested(bytes[])(bool)' "[$PAYLOAD]")
echo "2/4 settler attests the fill to our oracle: $ATTESTED"
[ "$ATTESTED" = "true" ] || { echo "fill not attested; payload or RPC out of date" >&2; exit 1; }

FEE=$(cast call --rpc-url "$BASE_RPC" "$BASE_ORACLE" \
  'quoteGasPayment(uint32,address,uint256,bytes,address,bytes[])(uint256)' \
  "$SEPOLIA_DOMAIN" "$SEPOLIA_ORACLE" "$GAS_LIMIT" 0x "$SETTLER" "[$PAYLOAD]" | awk '{print $1}')
echo "3/4 submit proof to Sepolia (Recoil Link fee $(cast from-wei "$FEE") ETH)"
SUBMIT_TX=$(cast send --rpc-url "$BASE_RPC" --private-key "$KEY" --json --value "$FEE" "$BASE_ORACLE" \
  'submit(uint32,address,uint256,bytes,address,bytes[])' \
  "$SEPOLIA_DOMAIN" "$SEPOLIA_ORACLE" "$GAS_LIMIT" 0x "$SETTLER" "[$PAYLOAD]" | jq -r .transactionHash)
echo "    submit tx $SUBMIT_TX"

echo "4/4 waiting for Recoil Link to deliver the proof to Sepolia..."
HASH=$(cast keccak "$PAYLOAD")
START=$(date +%s)
until [ "$(cast call --rpc-url "$SEPOLIA_RPC" "$SEPOLIA_ORACLE" 'isProven(uint256,bytes32,bytes32,bytes32)(bool)' \
  "$BASE_DOMAIN" "$(id $BASE_ORACLE)" "$(id $SETTLER)" "$HASH")" = "true" ]; do
  [ $(( $(date +%s) - START )) -gt 900 ] && { echo "not proven after 15 minutes" >&2; exit 1; }
  sleep 10
done
echo "PROVEN on Sepolia after $(( $(date +%s) - START ))s: Base Sepolia fill $ORDER_ID"
