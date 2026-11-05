# Publishing the npm packages

Recoil Link publishes 15 packages under the `@recoillink` npm scope (org `recoillink`). Four are for developers:

| Package             | For                                                  |
| ------------------- | ---------------------------------------------------- |
| `@recoillink/core`  | Solidity contracts and interfaces (`IMailbox`, ISMs) |
| `@recoillink/sdk`   | TypeScript: send, quote, track messages              |
| `@recoillink/utils` | Shared helpers used by the SDK                       |
| `@recoillink/cli`   | The `rlink` command                                  |

The other 11 are there because the SDK depends on them (`provider-sdk`, `deploy-sdk`, and the per-VM SDKs). The list lives in [`scripts/recoil-link/npm/packages.txt`](../../scripts/recoil-link/npm/packages.txt). Every other workspace package is `private` and can't be published by accident.

## Versions follow upstream

Packages keep Hyperlane's version numbers (`@recoillink/sdk@45.0.1` is built from Hyperlane 45.0.1 plus our changes). There are two reasons:

- **The contracts need it.** `@recoillink/core`'s version is compiled into every contract as `PACKAGE_VERSION`. The SDK compares it with Hyperlane version numbers to tell which features a deployed contract has (IGP, hooks, ISMs). Our deployed contracts report `12.2.0`, and a version of our own would break those checks.
- **Merges stay cheap.** Upstream release PRs bump these version lines. Keeping their numbers means upstream merges don't conflict on them.

So we publish **after each upstream sync**. For a Recoil-only release in between (a fix, or a README change), run:

```bash
node scripts/recoil-link/npm/recoil-version.mjs
```

It moves every published package to the **next patch with a `-recoil.N` suffix** (`45.1.0` → `45.1.1-recoil.1`, then `-recoil.2`), and regenerates the version constants the build derives from it. The next patch matters: `45.1.0-recoil.1` would sort _before_ `45.1.0` and look like a downgrade, while `45.1.1-recoil.1` sorts after our current release and before upstream's next one. Projects pinned to `^45.1.0` don't pick up prereleases; `npm install @recoillink/sdk` does, because we tag them `latest`. The next upstream sync takes upstream's versions again.

`@recoillink/core` moves too (`12.2.0` → `12.2.1-recoil.1`), which changes the `PACKAGE_VERSION` compiled into newly built contracts. Deployed contracts keep reporting their own version, and the SDK's feature checks compare against older upstream versions, which `12.2.1-recoil.1` still sorts above.

## What npm shows

Each package's npm page shows the README and `package.json` of its latest published version.

- **READMEs** are ours, in [`scripts/recoil-link/npm/readmes/`](../../scripts/recoil-link/npm/readmes/), one per package. `pack.sh` swaps each in only while packing and then restores upstream's README, so the repo keeps upstream's files and syncs never conflict over them. Every published package needs one; packing fails without it.
- **Keywords and descriptions** that name Hyperlane are replaced by `package-policy.mjs` (run by `rebrand.sh`), so they stay fixed after every sync.
- **What stays:** class names such as `HyperlaneCore` (the real API) and a one-line credit to Hyperlane in each README.

A change here reaches npm with the next published version of each package.

## Check before publishing

```bash
pnpm build
scripts/recoil-link/npm/pack.sh            # writes ./npm-packs, publishes nothing
```

`pack.sh` packs each package the way npm would. It fails if a package depends on something users couldn't install (an unlisted `@recoillink` package, or any `@hyperlane-xyz` package, which would pull Hyperlane's SDK into their install) or still has a `workspace:` dependency.

`@recoillink/core` is large (about 113 MB packed, about 19k files). That is expected: Hyperlane's own `@recoillink/core` is the same.

## First release (once, from a maintainer's machine)

Done on 2026-11-02 for all 15 packages; kept here for packages added later.

npm only lets you set up trusted publishing on a package that already exists, so the first version of each package goes out by hand:

1. **Log in.** Run `npm login` with an account that belongs to the `recoillink` org, with 2FA on.
2. **Pack.** Run `pnpm build && scripts/recoil-link/npm/pack.sh`.
3. **Publish in order.** Publish the tarballs in the order given in `npm-packs/order.txt`:

   ```bash
   while read -r dir; do
     name=$(node -p "require('./$dir/package.json').name")
     version=$(node -p "require('./$dir/package.json').version")
     # The ./ matters: without it npm reads "npm-packs/x.tgz" as a GitHub repo.
     npm publish "./npm-packs/$(echo "${name#@}" | tr / -)-$version.tgz" --access public
   done < npm-packs/order.txt
   ```

   npm says "Your package is being processed" and can take 10–20 minutes to show a new package. Until then the package may show only a `0.0.0-stage` placeholder; that's normal.

4. **Set up trusted publishing.** On npmjs.com, open each package's _Settings_, then _Trusted Publisher_, and add GitHub Actions with:
   - organization `recoil-labs`
   - repository `recoil-link`
   - workflow `recoil-link-npm-publish.yml`
   - environment: empty
   - _Allowed actions_: leave **"npm publish" unchecked** (staging only) and **"npm dist-tag" unchecked**
5. **Turn off tokens.** On the same page, set _Publishing access_ to "Require two-factor authentication and disallow tokens".

Trusted publisher configurations can **expire**: npm then rejects the workflow with `404 Not Found - PUT …`, and the package's page says "This trusted publisher configuration has expired. Delete it and create a new one." Before a release, check the Trusted Publisher section of a package or two.

## Later releases (GitHub Actions, staged)

Releases are **staged**: the workflow puts each new version in npm's staging area, and nothing goes live until a maintainer approves it with 2FA. A compromised workflow alone cannot ship a package.

1. Run **Recoil Link npm publish** from the Actions tab on `main`, first with `dry_run` on (the default): it builds, packs and runs `npm stage publish --dry-run`.
2. Run it again with `dry_run` off. It stages every new version with provenance and skips versions already published.
3. **Approve** the staged versions from a terminal logged in to npm (`npm login`), using the run id from the run's URL:

   ```bash
   scripts/recoil-link/npm/approve-run.sh <run-id> --list   # what the run staged
   scripts/recoil-link/npm/approve-run.sh <run-id>          # approve them, then check they're live
   ```

   It approves in dependency order (so `@recoillink/sdk` goes live after the packages it uses) and asks for your 2FA for each; accept "skip for 5 minutes" if npm offers it. You can also approve on each package's page on npmjs.com, or by hand with `npx -y 'npm@^11.15.0' stage approve <stage-id>` (the ids are in the run's log).

4. Check every version is live with provenance: `npm view @recoillink/sdk@<version> dist.attestations` prints the provenance details.

If a run stops partway, the versions it staged block a re-run (npm treats a staged version as taken). Approve them with `approve-run.sh <run-id>` (or reject them with `npm stage reject <stage-id>`), fix the cause, then run the workflow again; it skips anything already published. The usual cause is an expired or missing trusted publisher on the package the run stopped at (`401` or `404` on its upload).

GitHub Actions is on for this repo with every upstream workflow disabled; only this publish workflow runs. Re-enabling an upstream workflow (`gh workflow enable <name>`) is safe for publishing: upstream's `release.yml` can't publish to our packages, because npm only accepts the workflow named above.
