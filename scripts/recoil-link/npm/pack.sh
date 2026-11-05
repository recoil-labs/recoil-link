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
# Each package is published with our README from scripts/recoil-link/npm/readmes/,
# swapped in only while packing: upstream's README stays in the repo untouched,
# so upstream syncs never conflict over it.
readmes="$root/scripts/recoil-link/npm/readmes"
swapped=""
restore_readme() {
  [ -n "$swapped" ] || return 0
  if [ -f "$swapped.upstream" ]; then mv "$swapped.upstream" "$swapped"; else rm -f "$swapped"; fi
  swapped=""
}
trap restore_readme EXIT

while read -r dir; do
  name=$(node -p "require('$root/$dir/package.json').name")
  ours="$readmes/${name#@recoillink/}.md"
  [ -f "$ours" ] || { echo "error: no README for $name in $readmes" >&2; exit 1; }
  swapped="$root/$dir/README.md"
  [ -f "$swapped" ] && mv "$swapped" "$swapped.upstream"
  cp "$ours" "$swapped"
  # pnpm pack (not npm pack) turns workspace:* into real version ranges.
  (cd "$root/$dir" && pnpm pack --pack-destination "$out" > /dev/null)
  restore_readme
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
