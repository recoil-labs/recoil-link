#!/usr/bin/env bash
# Stages every package in packages.txt on npm, dependencies first. Nothing goes
# live until a maintainer approves the staged versions with 2FA.
# Versions already published are skipped. A version already staged makes npm
# refuse it: approve or reject the staged ones before re-running.
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
  # Staged, not published: a maintainer approves each version on npm with 2FA
  # (docs/recoil-link/npm-publishing.md). Trusted publishers may only stage.
  npm stage publish "$tgz" --access public --provenance --tag "$tag" $dry_run
done < "$out/order.txt"
