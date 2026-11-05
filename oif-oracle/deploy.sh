#!/usr/bin/env bash
# Deploy a RecoilLinkOracle on a testnet with a network-estimated gas limit.
# Usage: oif-oracle/deploy.sh <sepolia|basesepolia|optimismsepolia|bsctestnet|polygonamoy>
#
# Uses `forge create`, which asks the chain for the gas limit. `forge script`
# simulates locally instead, and its EVM can underprice contract creation on
# chains that repriced it (Sepolia: ~0.8M simulated vs ~6.2M required), so the
# transaction runs out of gas. The deployer key is read from
# ~/.recoil-link/keys/testnet-deployer and never printed.
set -euo pipefail
cd "$(dirname "$0")"

CHAIN="${1:?usage: deploy.sh <sepolia|basesepolia|optimismsepolia|bsctestnet|polygonamoy>}"
case "$CHAIN" in
  sepolia) RPC=https://ethereum-sepolia.publicnode.com; MAILBOX=0xA066332EF9C28158BDCf45D1a6138219e86CB6c6 ;;
  basesepolia) RPC=https://sepolia.base.org; MAILBOX=0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20 ;;
  optimismsepolia) RPC=https://sepolia.optimism.io; MAILBOX=0x0B10f22CDF275293f7B4a995699440B04799c3bC ;;
  bsctestnet) RPC=https://bsc-testnet.publicnode.com; MAILBOX=0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893 ;;
  polygonamoy) RPC=https://polygon-amoy-bor-rpc.publicnode.com; MAILBOX=0xa526198d90Cc17007fDD5Fe2fF21a657f04E4ff5 ;;
  *) echo "unknown chain $CHAIN" >&2; exit 1 ;;
esac
KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
[ -r "$KEY_FILE" ] || { echo "missing $KEY_FILE" >&2; exit 1; }
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
ZERO_ADDRESS=0x0000000000000000000000000000000000000000

ORACLE=$(forge create src/RecoilLinkOracle.sol:RecoilLinkOracle \
  --rpc-url "$RPC" --private-key "0x${KEY#0x}" --broadcast \
  --constructor-args "$MAILBOX" "$ZERO_ADDRESS" "$ZERO_ADDRESS" \
  | awk '/Deployed to:/ {print $3}')
[ -n "$ORACLE" ] || { echo "deployment failed" >&2; exit 1; }
# Load-balanced RPCs can lag a block behind the one that confirmed the deploy.
for _ in $(seq 1 30); do [ "$(cast code --rpc-url "$RPC" "$ORACLE")" != "0x" ] && break; sleep 2; done

echo "chain:            $CHAIN"
echo "RecoilLinkOracle: $ORACLE"
echo "MAILBOX():        $(cast call --rpc-url "$RPC" "$ORACLE" 'MAILBOX()(address)')"
echo "localDomain():    $(cast call --rpc-url "$RPC" "$ORACLE" 'localDomain()(uint32)')"
