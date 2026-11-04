#!/usr/bin/env bash
# Checks that scripts/recoil-link/protected-files.txt lists every upstream file
# carrying a hand-written Recoil Link change.
#
# It checks out upstream's version from where we last merged, applies
# rebrand.sh, and compares each file we changed (as it is on disk, so it runs
# before committing too) with the result. A file rebrand.sh can't reproduce was
# edited by hand: if it is not in the protected list, an upstream sync could
# overwrite it. Changes nothing in this checkout.
#
#   scripts/recoil-link/check-protected.sh
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"
git remote get-url upstream > /dev/null 2>&1 || { echo "error: no 'upstream' remote" >&2; exit 1; }
git fetch -q upstream main

base=$(git merge-base HEAD upstream/main)
tmp=$(mktemp -d)
trap 'git worktree remove --force "$tmp/tree" > /dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

echo "==> rebranding upstream at $(git log -1 --format=%h "$base") in a temporary worktree"
git worktree add -q --detach "$tmp/tree" "$base"
mkdir -p "$tmp/tree/scripts/recoil-link"
cp scripts/recoil-link/rebrand.sh scripts/recoil-link/package-policy.mjs "$tmp/tree/scripts/recoil-link/"
ln -s "$root/node_modules" "$tmp/tree/node_modules"
(cd "$tmp/tree" && bash scripts/recoil-link/rebrand.sh > /dev/null)

protected() {
  grep -vE '^\s*(#|$)' scripts/recoil-link/protected-files.txt | grep -qxF -- "$1"
}

missing=()
while IFS=$'\t' read -r status path; do
  [ "$status" = M ] || continue
  [ "$path" = pnpm-lock.yaml ] && continue
  if ! cmp -s "$path" "$tmp/tree/$path" && ! protected "$path"; then
    missing+=("$path")
  fi
done < <(git diff --name-status --no-renames "$base")

if [ ${#missing[@]} -eq 0 ]; then
  echo "OK: every hand-edited upstream file is protected."
  exit 0
fi
echo "Hand-edited upstream files missing from protected-files.txt:"
printf '  %s\n' "${missing[@]}"
echo "Add them to the list, or move the edit into rebrand.sh / package-policy.mjs."
echo "(A difference that is only formatting, such as a reordered dependency, can be ignored.)"
exit 1
