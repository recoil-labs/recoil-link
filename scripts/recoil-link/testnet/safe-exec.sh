#!/usr/bin/env bash
# Execute one call from the treasury Safe (1-of-1) using the owner's key,
# without the Safe app. Works on chains the app does not list.
# Usage: scripts/recoil-link/testnet/safe-exec.sh <rpc-url> <target> <calldata> [--dry-run]
#
# The owner calls execTransaction itself with a "pre-validated" signature
# (r = owner address, s = 0, v = 1), which the Safe accepts from its owner. The
# call is simulated first and nothing is sent if the simulation fails or
# --dry-run is given. Owner key: ~/.recoil-link/keys/testnet-deployer.
set -euo pipefail

RPC="${1:?usage: safe-exec.sh <rpc-url> <target> <calldata> [--dry-run]}"
TO="${2:?target address}"
DATA="${3:?calldata}"
DRY_RUN="${4:-}"
SAFE=0x020BC752682191Fa9997B3307A8FC9710aeA3365
ZERO=0x0000000000000000000000000000000000000000

KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"; KEY="0x${KEY#0x}"
OWNER=$(cast wallet address --private-key "$KEY")

[ "$(cast call --rpc-url "$RPC" "$SAFE" 'getThreshold()(uint256)')" = "1" ] || { echo "Safe threshold is not 1; use the Safe app" >&2; exit 1; }
cast call --rpc-url "$RPC" "$SAFE" 'isOwner(address)(bool)' "$OWNER" | grep -q true || { echo "$OWNER is not a Safe owner" >&2; exit 1; }

SIG="0x000000000000000000000000${OWNER#0x}000000000000000000000000000000000000000000000000000000000000000001"
SIGNATURE='execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)(bool)'
ARGS=("$TO" 0 "$DATA" 0 0 0 0 "$ZERO" "$ZERO" "$SIG")

echo "simulating Safe call to $TO ..."
OK=$(cast call --rpc-url "$RPC" --from "$OWNER" "$SAFE" "$SIGNATURE" "${ARGS[@]}")
[ "$OK" = "true" ] || { echo "simulation returned $OK; not sending" >&2; exit 1; }
echo "simulation ok"
[ "$DRY_RUN" = "--dry-run" ] && exit 0

cast send --rpc-url "$RPC" --private-key "$KEY" "$SAFE" "${SIGNATURE%(bool)}" "${ARGS[@]}" | grep -E '^(status|transactionHash)'
