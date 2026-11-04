#!/usr/bin/env bash
# Merges upstream Hyperlane into a new branch and resolves the mechanical
# conflicts. It does not commit: review what it reports, finish any conflicts
# it left, build and test, then commit and open a PR.
#
#   scripts/recoil-link/sync-upstream.sh
#
# How conflicts are resolved:
#   - A file in scripts/recoil-link/protected-files.txt (hand-written Recoil
#     Link changes): left conflicted for a person. Never auto-resolved.
#   - pnpm-lock.yaml: regenerated.
#   - Deleted upstream, renamed by us (e.g. released .changeset notes): deleted.
#   - Anything else: upstream's version, then rebrand.sh puts our renames and
#     package.json policy back.
# Process: docs/recoil-link/upstream-sync.md
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

die() { echo "error: $*" >&2; exit 1; }

[ -z "$(git status --porcelain)" ] || die "the working tree has changes; commit or stash them first"
! git rev-parse -q --verify MERGE_HEAD > /dev/null || die "a merge is already in progress"
git remote get-url upstream > /dev/null 2>&1 \
  || die "no 'upstream' remote: git remote add upstream https://github.com/hyperlane-xyz/hyperlane-monorepo.git"

echo "==> fetching origin and upstream"
git fetch -q origin main
git fetch -q upstream main
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] \
  || die "local main differs from origin/main; run: git checkout main && git pull"

base=$(git merge-base origin/main upstream/main)
behind=$(git rev-list --count "$base..upstream/main")
if [ "$behind" -eq 0 ]; then
  echo "Already up to date with upstream."
  exit 0
fi
echo "    $behind upstream commits to merge ($(git log -1 --format=%h upstream/main))"

branch="sync/upstream-$(date +%Y-%m-%d)"
git show-ref --verify --quiet "refs/heads/$branch" && die "branch $branch already exists"
git switch -q -c "$branch" origin/main
echo "==> merging upstream/main into $branch"
git merge --no-ff --no-commit upstream/main > /dev/null 2>&1 || true

protected() {
  grep -vE '^\s*(#|$)' scripts/recoil-link/protected-files.txt | grep -qxF -- "$1"
}

left=()
auto=0
# Porcelain status of each unmerged path: UU both modified, UD deleted by
# them, DU deleted by us, AA/UA/AU added on one or both sides.
while IFS= read -r line; do
  code=${line:0:2}
  path=${line:3}
  if protected "$path"; then
    left+=("$path")
  elif [ "$path" = pnpm-lock.yaml ]; then
    git checkout --theirs -- "$path" && git add -- "$path"
  elif [ "$code" = UD ]; then
    git rm -q -- "$path"
    auto=$((auto + 1))
  elif [ "$code" = DU ]; then
    left+=("$path") # we deleted something upstream still changes: a person decides
  else
    git checkout --theirs -- "$path" && git add -- "$path"
    auto=$((auto + 1))
  fi
done < <(git status --porcelain | grep -E '^(UU|UD|DU|AA|UA|AU|DD) ')
echo "    auto-resolved $auto conflicted files"

echo "==> re-applying the Recoil Link rebrand"
scripts/recoil-link/rebrand.sh | sed 's/^/    /'

echo "==> regenerating pnpm-lock.yaml"
pnpm install --lockfile-only > /dev/null

# Stage what rebrand and pnpm changed, but leave conflicted files unstaged
# so git still reports them.
git add -u
for f in "${left[@]+"${left[@]}"}"; do git reset -q -- "$f"; done

echo "==> checking published packages"
node scripts/recoil-link/npm/order.mjs > /dev/null && echo "    no @hyperlane-xyz runtime dependencies"

echo
echo "Merged $behind upstream commits into $branch (not committed)."
if [ ${#left[@]} -gt 0 ]; then
  echo
  echo "Resolve these conflicts by hand (Recoil Link changes; keep ours, take theirs where it's a fix):"
  printf '  %s\n' "${left[@]}"
fi
review=$(git diff --name-only "$base" upstream/main | while IFS= read -r f; do protected "$f" && echo "$f"; done || true)
if [ -n "$review" ]; then
  echo
  echo "Upstream changed these protected files; check our change survived:"
  echo "$review" | sed 's/^/  /'
fi
echo
echo "Next: pnpm build && pnpm test, then commit the merge and open a PR (docs/recoil-link/upstream-sync.md)."
