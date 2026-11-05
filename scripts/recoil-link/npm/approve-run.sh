#!/usr/bin/env bash
# Approves everything a "Recoil Link npm publish" run staged, then checks each
# version is live on npm. Run it on a maintainer's machine, logged in to npm
# (npm login); each approval asks for your 2FA.
#
#   scripts/recoil-link/npm/approve-run.sh <run-id>          # list, then approve
#   scripts/recoil-link/npm/approve-run.sh <run-id> --list   # list only
#
# The run id is the number at the end of the run's URL on GitHub Actions.
set -euo pipefail

run="${1:?usage: approve-run.sh <run-id> [--list]}"
mode="${2:-approve}"
repo=recoil-labs/recoil-link
npm_stage=(npx -y 'npm@^11.15.0' stage) # npm stage needs npm 11.15+

# publish.sh prints one line per staged version:
#   + @recoillink/sdk@45.1.0 (staged with id 8c8562b2-...)
staged=$(gh run view "$run" --repo "$repo" --log \
  | sed -nE 's/.*\+ (@recoillink\/[^ ]+@[^ ]+) \(staged with id ([0-9a-f-]+)\).*/\1 \2/p' \
  | awk '!seen[$0]++')
# Kept in the log's order, which is dependency order: a package is approved
# only after the packages it depends on, so installs never see a gap.

if [ -z "$staged" ]; then
  echo "Run $run staged nothing (or its log has expired)."
  exit 0
fi

echo "Run $run staged:"
echo "$staged" | awk '{printf "  %-40s %s\n", $1, $2}'
[ "$mode" = --list ] && exit 0

echo
echo "Approving (npm asks for your 2FA for each; accept 'skip for 5 minutes' if offered)..."
while read -r spec id; do
  echo "==> $spec"
  "${npm_stage[@]}" approve "$id" < /dev/tty
done <<< "$staged"

echo
echo "Checking they are live (npm can take a minute to show a new version)..."
while read -r spec _; do
  name=${spec%@*}
  version=${spec##*@}
  live=""
  for _ in $(seq 1 12); do
    live=$(npm view "$spec" version 2> /dev/null || true)
    [ "$live" = "$version" ] && break
    sleep 10
  done
  if [ "$live" = "$version" ]; then
    echo "  live       $spec"
  else
    echo "  NOT LIVE   $spec (check https://www.npmjs.com/package/$name)"
  fi
done <<< "$staged"
