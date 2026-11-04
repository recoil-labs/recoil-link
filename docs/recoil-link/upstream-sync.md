# Syncing with upstream Hyperlane

Recoil Link is a fork of [hyperlane-monorepo](https://github.com/hyperlane-xyz/hyperlane-monorepo). Hyperlane's fixes and improvements reach us only when we merge them in. The `upstream` remote points at their repository.

## When

- **Every two weeks**, as routine. Upstream moves fast (35 commits in the first 8 days after we forked, 14 of them fixes), and a small gap merges more easily than a large one.
- **Immediately** when Hyperlane publishes a security advisory or a release that fixes the contracts or the agents. On GitHub, watch hyperlane-xyz/hyperlane-monorepo with **Custom → Releases** and **Security alerts**.

## Steps

```bash
git checkout main && git pull
scripts/recoil-link/sync-upstream.sh
```

The script:

1. Refuses to run unless the working tree is clean and `main` matches `origin/main`.
2. Creates `sync/upstream-<date>` from `main` and merges `upstream/main` without committing.
3. Resolves the mechanical conflicts:
   - **Protected files** (`scripts/recoil-link/protected-files.txt`, upstream files with hand-written Recoil Link changes): never touched. Their conflicts are left for you.
   - **Deleted upstream, renamed by us** (for example `.changeset` notes consumed by an upstream release): deleted.
   - **Everything else:** upstream's version, then `rebrand.sh` re-applies our renames and `package-policy.mjs` re-applies our `package.json` settings (private packages, a removed dependency, an extra export).
4. Regenerates `pnpm-lock.yaml`.
5. Checks that no published package depends on an `@hyperlane-xyz` package (`scripts/recoil-link/npm/order.mjs`).
6. Lists any conflicts left for you, and every protected file upstream changed, even where git merged it cleanly.

Then:

1. **Finish the conflicts it left.** Keep our change and take upstream's fix around it.
2. **Review the protected files it listed.** Check our change is still there and still makes sense next to theirs.
3. **Build and test:** `pnpm install && pnpm build && pnpm test`, plus `cargo test` in `rust/main` if the agents changed. Don't run `cargo fmt` on files you didn't change.
4. **Commit** the merge (`git commit` completes it), push, and open a PR titled `chore: sync upstream Hyperlane (<date>)`. List upstream's notable fixes in the description, especially anything touching `solidity/contracts`, `rust/main/agents` or the SDK.
5. **After merging:**
   - **Contracts or agents changed:** plan redeploying them (contracts) or building new agent images (whoever operates the agents).
   - **Package versions moved:** they follow upstream's, so publish a release ([npm-publishing.md](./npm-publishing.md)).

## What the sync does not handle

- **Upstream deleting or renaming a file we protect.** The script stops at that conflict; decide by hand.
- **Upstream changing behaviour Recoil Link relies on**, such as the Mailbox interface, message format or fee hooks. A clean merge can still change behaviour, so read the upstream changes to `solidity/contracts`, `typescript/sdk/src/core` and `rust/main/agents` before merging the PR.
- **Rust formatting.** The script doesn't touch Rust beyond the merge itself.

## Keeping the protected list honest

The sync is only safe if every hand edit to an upstream file is either protected or re-created by a script. When you change an upstream file by hand (anything outside `rebrand.sh`'s renames), do one of these:

- add the file to `scripts/recoil-link/protected-files.txt`, or
- move the edit into `rebrand.sh` or `package-policy.mjs`, so it is re-applied automatically.

`scripts/recoil-link/check-protected.sh` finds misses. It rebrands upstream's version in a temporary worktree, compares it with ours, and lists any hand-edited file that isn't protected. Run it before a sync and in any PR that edits upstream files.

## Tested

On 4 November 2026 the script merged 35 upstream commits in a throwaway copy of the repo:

- **Conflicts:** all 49 resolved automatically: 28 `package.json` version bumps, 18 released changesets and 3 source files touched by renames.
- **Our changes:** every protected file upstream hadn't touched came out identical to `main`, and the one it had (a test) kept our edit.
- **Policy and imports:** the `package.json` policy was intact, and no stray `@hyperlane-xyz` imports came back.
- **Not done in that test:** the build and tests, which the sync PR itself runs.
