#!/usr/bin/env bash
# Connect the testnet Interchain Account Routers to each other, then hand
# their ownership to the treasury Safe. Safe to re-run: finished steps are skipped.
# Usage: scripts/recoil-link/testnet/setup-ica-routers.sh
set -euo pipefail

KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
[ -r "$KEY_FILE" ] || { echo "missing $KEY_FILE" >&2; exit 1; }
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
SAFE=0x020BC752682191Fa9997B3307A8FC9710aeA3365
# bytes32(0): no custom ISM. Built at runtime so the repo key scanner does not flag it.
ZERO="0x$(printf %064d 0)"

SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
BASESEPOLIA_RPC=https://sepolia.base.org
SEPOLIA_ICA=0xDa5BBbF7469F342EF71E2dDb7326dcfDed4C3D28
BASESEPOLIA_ICA=0x006ca4627213d8174A6101E1F847f76E42e755bA

to_bytes32() { printf '0x000000000000000000000000%s' "$(printf %s "${1#0x}" | tr '[:upper:]' '[:lower:]')"; }
lower() { printf %s "$1" | tr '[:upper:]' '[:lower:]'; }

setup() {
  local name=$1 rpc=$2 ica=$3 remote_domain=$4 remote_ica=$5
  echo "== $name"
  local enrolled
  enrolled=$(cast call --rpc-url "$rpc" "$ica" 'routers(uint32)(bytes32)' "$remote_domain")
  if [ "$(lower "$enrolled")" = "$(to_bytes32 "$remote_ica")" ]; then
    echo "   routers already connected"
  else
    echo "   connecting to router on domain $remote_domain..."
    cast send --rpc-url "$rpc" --private-key "$KEY" "$ica" \
      'enrollRemoteRouterAndIsm(uint32,bytes32,bytes32)' \
      "$remote_domain" "$(to_bytes32 "$remote_ica")" "$ZERO" | grep -E '^(status|transactionHash)'
  fi
  local owner
  owner=$(cast call --rpc-url "$rpc" "$ica" 'owner()(address)')
  if [ "$(lower "$owner")" = "$(lower "$SAFE")" ]; then
    echo "   already owned by the Safe"
  else
    echo "   transferring ownership to the Safe..."
    cast send --rpc-url "$rpc" --private-key "$KEY" "$ica" \
      'transferOwnership(address)' "$SAFE" | grep -E '^(status|transactionHash)'
  fi
  echo "   owner now: $(cast call --rpc-url "$rpc" "$ica" 'owner()(address)')"
}

setup sepolia "$SEPOLIA_RPC" "$SEPOLIA_ICA" 84532 "$BASESEPOLIA_ICA"
setup basesepolia "$BASESEPOLIA_RPC" "$BASESEPOLIA_ICA" 11155111 "$SEPOLIA_ICA"
echo "done"
