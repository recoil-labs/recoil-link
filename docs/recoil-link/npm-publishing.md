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

`@recoillink/core` is large (about 113 MB packed, about 19k files). That is expected: Hyperlane's own `@hyperlane-xyz/core` is the same.

## First release (once, from a maintainer's machine)

npm only lets you set up trusted publishing on a package that already exists, so the first version of each package goes out by hand:

1. **Log in.** Run `npm login` with an account that belongs to the `recoillink` org, with 2FA on.
2. **Pack.** Run `pnpm build && scripts/recoil-link/npm/pack.sh`.
3. **Publish in order.** Publish the tarballs in the order given in `npm-packs/order.txt`:

   ```bash
   while read -r dir; do
     name=$(node -p "require('./$dir/package.json').name")
     version=$(node -p "require('./$dir/package.json').version")
     npm publish "npm-packs/$(echo "${name#@}" | tr / -)-$version.tgz" --access public
   done < npm-packs/order.txt
   ```

4. **Set up trusted publishing.** On npmjs.com, open each package's _Settings_, then _Trusted publishing_, and add GitHub Actions with:
   - organization `recoil-labs`
   - repository `recoil-link`
   - workflow `recoil-link-npm-publish.yml`
5. **Turn off tokens.** On the same page, set _Publishing access_ to "Require two-factor authentication and disallow tokens".

## Later releases (GitHub Actions)

Run **Recoil Link npm publish** from the Actions tab on `main`:

- Run it first with `dry_run` on (the default). It builds, packs and runs `npm publish --dry-run`.
- Then run it again with `dry_run` off. It publishes with provenance and skips versions already on npm, so a failed run can be re-run.

GitHub Actions is currently **off** for this repo. Turning it on also turns on every upstream workflow. Most need Hyperlane's own runners and secrets, so they fail harmlessly, but disable the ones you don't want (`gh workflow disable <name>`) first. Upstream's `release.yml` can't publish to our packages: npm only accepts the workflow named above.
