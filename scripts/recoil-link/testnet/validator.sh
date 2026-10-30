#!/usr/bin/env bash
# Run the Recoil Link validator for one origin chain (testnet).
# Usage: scripts/recoil-link/testnet/validator.sh <sepolia|basesepolia>
#
# Signs checkpoints of messages sent from <chain> and stores them locally.
# The key is read from ~/.recoil-link/keys/testnet-validator and never logged.
# The validator address needs a little ETH on <chain> to announce itself once.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CHAIN="${1:?usage: validator.sh <chain>}"
STATE="$HOME/.recoil-link/agents"
KEY_FILE="$HOME/.recoil-link/keys/testnet-validator"
[ -r "$KEY_FILE" ] || { echo "missing $KEY_FILE" >&2; exit 1; }
case "$CHAIN" in
  sepolia) PORT=9091 ;;
  basesepolia) PORT=9092 ;;
  *) echo "unknown chain $CHAIN" >&2; exit 1 ;;
esac

mkdir -p "$STATE/validator-$CHAIN/db" "$STATE/checkpoints/$CHAIN"
export CONFIG_FILES="$PWD/configs/recoil-link/testnet/agent-config.json"
export HYP_ORIGINCHAINNAME="$CHAIN"
export HYP_DB="$STATE/validator-$CHAIN/db"
export HYP_VALIDATOR_TYPE=hexKey
export HYP_VALIDATOR_KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
# Signer for the one-time announce transaction (macOS bash 3.2: no ${VAR^^}).
CHAIN_UPPER="$(printf %s "$CHAIN" | tr "[:lower:]" "[:upper:]")"
export "HYP_CHAINS_${CHAIN_UPPER}_SIGNER_TYPE=hexKey"
export "HYP_CHAINS_${CHAIN_UPPER}_SIGNER_KEY=$HYP_VALIDATOR_KEY"
export HYP_CHECKPOINTSYNCER_TYPE=localStorage
export HYP_CHECKPOINTSYNCER_PATH="$STATE/checkpoints/$CHAIN"
export HYP_METRICSPORT="$PORT"
export HYP_LOG_FORMAT=pretty

exec rust/main/target/release/validator
