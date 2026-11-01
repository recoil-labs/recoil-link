#!/usr/bin/env bash
# Create the Recoil Labs treasury Safe on a chain the Safe app does not list,
# at the same address as everywhere else (0x020BC752682191Fa9997B3307A8FC9710aeA3365).
# Usage: scripts/recoil-link/testnet/deploy-safe.sh <rpc-url>
#
# Replays the Safe's original creation (Sepolia tx 0x49e35854…5f5168; full
# record from the Safe transaction service, /api/v1/safes/<safe>/creation/):
# Safe v1.5.0 factory, L2 singleton, salt 0, and the
# same setup data (owner 0xfd44…49D3, threshold 1). The address is fixed by
# those inputs, so the script refuses to send unless the simulation returns it.
# The deployer key pays gas; it is read from ~/.recoil-link/keys/testnet-deployer.
set -euo pipefail

RPC="${1:?usage: deploy-safe.sh <rpc-url>}"
SAFE=0x020BC752682191Fa9997B3307A8FC9710aeA3365
FACTORY=0x14F2982D601c9458F93bd70B218933A6f8165e7b
SINGLETON_L2=0xFf51A5898e281Db6DfC7855790607438dF2ca44b
SETUP=0xb63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000900c7589200010d6c6ecaae5b06ebe653bc2d82a00000000000000000000000000000000000000000000000000000000000001400000000000000000000000003efcbb83a4a7afcb4f68d501e2c2203a38be77f4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005afe7a11e70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fd446002b2979559ef4cd06e5dcc84bbcc6b49d30000000000000000000000000000000000000000000000000000000000000024fe51f643000000000000000000000000edd160febbd92e350d4d398fb636302fccd67c7e00000000000000000000000000000000000000000000000000000000
KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"; KEY="0x${KEY#0x}"

lower() { printf %s "$1" | tr '[:upper:]' '[:lower:]'; }
if [ "$(cast code --rpc-url "$RPC" "$SAFE")" != "0x" ]; then
  echo "Safe already deployed on this chain"
else
  PREDICTED=$(cast call --rpc-url "$RPC" --from "$(cast wallet address --private-key "$KEY")" "$FACTORY" \
    'createProxyWithNonce(address,bytes,uint256)(address)' "$SINGLETON_L2" "$SETUP" 0)
  [ "$(lower "$PREDICTED")" = "$(lower "$SAFE")" ] || { echo "would deploy $PREDICTED, not $SAFE; refusing" >&2; exit 1; }
  cast send --rpc-url "$RPC" --private-key "$KEY" "$FACTORY" \
    'createProxyWithNonce(address,bytes,uint256)' "$SINGLETON_L2" "$SETUP" 0 | grep -E '^(status|transactionHash)'
fi
echo "owners:    $(cast call --rpc-url "$RPC" "$SAFE" 'getOwners()(address[])')"
echo "threshold: $(cast call --rpc-url "$RPC" "$SAFE" 'getThreshold()(uint256)')"
