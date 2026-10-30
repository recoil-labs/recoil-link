#!/usr/bin/env bash
# Run the Recoil Link relayer between the testnets.
# Usage: scripts/recoil-link/testnet/relayer.sh
#
# Delivers messages that prepaid gas through our IGP (minimum 1 wei), using
# checkpoints written by validator.sh. The relayer key pays destination gas;
# on testnet it is the deployer key (~/.recoil-link/keys/testnet-deployer).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

STATE="$HOME/.recoil-link/agents"
KEY_FILE="$HOME/.recoil-link/keys/testnet-deployer"
[ -r "$KEY_FILE" ] || { echo "missing $KEY_FILE" >&2; exit 1; }

mkdir -p "$STATE/relayer/db"
export CONFIG_FILES="$PWD/configs/recoil-link/testnet/agent-config.json"
export HYP_RELAYCHAINS=sepolia,basesepolia
export HYP_DB="$STATE/relayer/db"
export HYP_DEFAULTSIGNER_TYPE=hexKey
export HYP_DEFAULTSIGNER_KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
# Validators write checkpoints to local folders on this machine.
export HYP_ALLOWLOCALCHECKPOINTSYNCERS=true
export HYP_GASPAYMENTENFORCEMENT='[{"type":"minimum","payment":"1"}]'
export HYP_METRICSPORT=9090
export HYP_LOG_FORMAT=pretty

exec rust/main/target/release/relayer
