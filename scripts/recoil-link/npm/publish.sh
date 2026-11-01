#!/usr/bin/env bash
# Publishes every package in packages.txt to npm, dependencies first.
# Versions already on npm are skipped, so a failed run can be re-run.
# Meant for .github/workflows/recoil-link-npm-publish.yml (npm trusted
# publishing, no token); run `pnpm build` first.
#
#   scripts/recoil-link/npm/publish.sh <dist-tag> [--dry-run]
set -euo pipefail

tag="${1:?usage: publish.sh <dist-tag> [--dry-run]}"
dry_run="${2:-}"
root="$(cd "$(dirname "$0")/../../.." && pwd)"
out="$root/npm-packs"

"$root/scripts/recoil-link/npm/pack.sh" "$out"

while read -r dir; do
  name=$(node -p "require('$root/$dir/package.json').name")
  version=$(node -p "require('$root/$dir/package.json').version")
  tgz="$out/$(echo "${name#@}" | tr / -)-$version.tgz"
  if [ -n "$(npm view "$name@$version" version 2> /dev/null)" ]; then
    echo "skip $name@$version: already on npm"
    continue
  fi
  echo "publish $name@$version (tag $tag)"
  npm publish "$tgz" --access public --provenance --tag "$tag" $dry_run
done < "$out/order.txt"
