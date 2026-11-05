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

So we publish **after each upstream sync**. For a Recoil-only fix in between, give the TypeScript packages a prerelease suffix (`45.0.1-recoil.1`). Never move `@recoillink/core` off upstream's version.

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
3. **Approve** the staged versions, on each package's page on npmjs.com or from a terminal logged in to npm (npm 11.15 or later; `npx -y npm@^11.15.0` works with older installs):

   ```bash
   npm stage list @recoillink/sdk        # shows the stage id of each staged version
   npm stage approve <stage-id>          # asks for your 2FA code
   ```

4. Check each version is live: `npm view @recoillink/sdk@<version> version`.

If a run stops partway, the versions it staged block a re-run (npm treats a staged version as taken). Approve them, or reject them with `npm stage reject <stage-id>`, then run the workflow again; it skips anything already published.

GitHub Actions is currently **off** for this repo. Turning it on also turns on every upstream workflow. Most need Hyperlane's own runners and secrets, so they fail harmlessly, but disable the ones you don't want (`gh workflow disable <name>`) first. Upstream's `release.yml` can't publish to our packages: npm only accepts the workflow named above.
