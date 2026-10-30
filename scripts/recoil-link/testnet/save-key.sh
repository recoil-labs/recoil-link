#!/usr/bin/env bash
# Save a testnet private key to ~/.recoil-link/keys/testnet-<name> (mode 600)
# and print the wallet address it belongs to. The key is never echoed.
# Usage: scripts/recoil-link/testnet/save-key.sh <validator|deployer>
set -euo pipefail

NAME="${1:?usage: save-key.sh <validator|deployer>}"
DIR="$HOME/.recoil-link/keys"
FILE="$DIR/testnet-$NAME"
mkdir -p "$DIR" && chmod 700 "$DIR"

printf 'Paste the %s private key, then press Enter (input is hidden): ' "$NAME"
IFS= read -rs KEY; echo
KEY="$(printf %s "$KEY" | tr -d '[:space:]')"
if ! printf %s "$KEY" | grep -Eq '^(0x)?[0-9a-fA-F]{64}$'; then
  echo "That is not a private key (expected 64 hex characters, optional 0x). Nothing saved." >&2
  exit 1
fi

( umask 077 && printf '%s\n' "$KEY" > "$FILE" )
chmod 600 "$FILE"
echo "Saved to $FILE"
echo "Wallet address: $(cast wallet address --private-key "$KEY")"
