#!/usr/bin/env bash
# Packs every package in packages.txt into a directory (default: ./npm-packs)
# exactly as npm would publish it, and lists name, version, size and file
# count. Run `pnpm build` first. Publishes nothing.
#
#   scripts/recoil-link/npm/pack.sh [out-dir]
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
out="$(mkdir -p "${1:-$root/npm-packs}" && cd "${1:-$root/npm-packs}" && pwd)"
rm -f "$out"/*.tgz

node "$root/scripts/recoil-link/npm/order.mjs" > "$out/order.txt"
while read -r dir; do
  # pnpm pack (not npm pack) turns workspace:* into real version ranges.
  (cd "$root/$dir" && pnpm pack --pack-destination "$out" > /dev/null)
done < "$out/order.txt"

for tgz in "$out"/*.tgz; do
  files=$(tar -tzf "$tgz" | wc -l | tr -d ' ')
  size=$(du -h "$tgz" | cut -f1)
  printf '%-48s %6s %6s files\n' "$(basename "$tgz")" "$size" "$files"
  if tar -xzOf "$tgz" package/package.json | grep -q '"workspace:'; then
    echo "  error: still has a workspace: dependency" >&2
    exit 1
  fi
done
