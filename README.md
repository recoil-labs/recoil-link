# Recoil Link

[![@recoillink/core](https://img.shields.io/npm/v/@recoillink/core?label=%40recoillink%2Fcore)](https://www.npmjs.com/package/@recoillink/core)
[![@recoillink/sdk](https://img.shields.io/npm/v/@recoillink/sdk?label=%40recoillink%2Fsdk)](https://www.npmjs.com/package/@recoillink/sdk)
[![@recoillink/cli](https://img.shields.io/npm/v/@recoillink/cli?label=%40recoillink%2Fcli)](https://www.npmjs.com/package/@recoillink/cli)
[![@recoillink/utils](https://img.shields.io/npm/v/@recoillink/utils?label=%40recoillink%2Futils)](https://www.npmjs.com/package/@recoillink/utils)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE.md)

Recoil Link is a cross-chain **messaging and proof layer** by [Recoil Labs](https://github.com/recoil-labs). An application sends a message on one chain; Recoil Link's validators attest to it and its relayer delivers it, so a contract on another chain can act on proof that something happened.

The main use is proving cross-chain intent fills: Recoil Link can serve as the oracle for the [Open Intents Framework](https://github.com/openintentsframework) (see `oif-oracle/`), replacing development-only oracles such as `AlwaysYesOracle`. Token bridging ("warp routes") is not part of Recoil Link's product: that upstream code is kept dormant, never deployed, and its CLI commands are disabled.

Supported networks: EVM chains, Solana (SVM), Cosmos, Starknet, Aleo, Radix and Tron today, with Move-based chains (the Aptos and Sui families) on the roadmap.

## Packages

| Package                                                                | Install                    | For                                                                 |
| ---------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| [`@recoillink/core`](https://www.npmjs.com/package/@recoillink/core)   | `npm i @recoillink/core`   | Solidity contracts and interfaces (`IMailbox`, `MockMailbox`, ISMs) |
| [`@recoillink/sdk`](https://www.npmjs.com/package/@recoillink/sdk)     | `npm i @recoillink/sdk`    | Send, quote and track messages from TypeScript                      |
| [`@recoillink/cli`](https://www.npmjs.com/package/@recoillink/cli)     | `npm i -g @recoillink/cli` | The `rlink` command                                                 |
| [`@recoillink/utils`](https://www.npmjs.com/package/@recoillink/utils) | `npm i @recoillink/utils`  | Helpers used by the SDK                                             |

All packages are listed under the [`recoillink`](https://www.npmjs.com/org/recoillink) npm org. Releases are on the [Releases](https://github.com/recoil-labs/recoil-link/releases) page; publishing is described in [`docs/recoil-link/npm-publishing.md`](./docs/recoil-link/npm-publishing.md).

## Quick start

```sh
npm install -g @recoillink/cli
rlink --help
```

To build the CLI from source instead:

```sh
pnpm install
pnpm build
pnpm --filter @recoillink/cli run rlink --help
```

The CLI reads chain metadata and deployment addresses from the [Recoil Link registry](https://github.com/recoil-labs/recoil-link-registry) by default, plus any local overrides in `~/.recoil-link`.

## Attribution

Recoil Link is a fork of [Hyperlane](https://github.com/hyperlane-xyz/hyperlane-monorepo), licensed under the Apache License 2.0. See [NOTICE](./NOTICE) for details. Internal contract, crate and type names (for example `Mailbox`, `HyperlaneCore`) are kept from upstream so that upstream fixes can still be merged; see [`scripts/recoil-link/rebrand.sh`](./scripts/recoil-link/rebrand.sh) for what is renamed.

## Working on Recoil Link

### Prerequisites

#### Install `jq`

You need `jq` installed on your machine. You can download it from [official page](https://jqlang.org/download/) or use a package manager of your choice.

#### Install `gitleaks`

You need `gitleaks` installed on your machine. You can download it from [official page](https://github.com/gitleaks/gitleaks) or use a package manager of your choice.

#### Install `typos`

[typos](https://github.com/crate-ci/typos) is used for spell checking. Install it via your package manager:

```bash
# macOS
brew install typos-cli

# or via cargo
cargo install typos-cli --locked
```

#### Foundry

First ensure you have Foundry installed on your machine.

Run the following to install `foundryup`:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

Then run `foundryup` with the pinned version to install `forge`, `cast`, `anvil` and `chisel`.

```bash
foundryup --install $(cat solidity/.foundryrc)
```

Check out the [Foundry Book](https://getfoundry.sh/introduction/installation/) for more information.

#### Node

This repository targets v24 of node. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage your node version.

To install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

To install version 24

```bash
nvm install 24
nvm use 24
```

You should change versions automatically with the `.nvmrc` file.

### Workspaces

This monorepo uses [pnpm workspaces](https://pnpm.io/workspaces). Installing dependencies, building, testing, and running prettier for all packages can be done from the root directory of the repository.

- Installing dependencies

  ```bash
  pnpm install
  ```

- Building

  ```bash
  pnpm build
  ```

If you are using [VSCode](https://code.visualstudio.com/), you can launch the [multi-root workspace](https://code.visualstudio.com/docs/editor/multi-root-workspaces) with `code mono.code-workspace`, install the recommended workspace extensions, and use the editor settings.

### Logging

The typescript tooling uses [Pino](https://github.com/pinojs/pino) based logging, which outputs structured JSON logs by default.
The verbosity level and style can be configured with environment variables:

```sh
LOG_LEVEL=DEBUG|INFO|WARN|ERROR|OFF
LOG_FORMAT=PRETTY|JSON
```

### Rust

See [`rust/README.md`](rust/README.md)

### Release Agents

- Tag the commit with the current date in the format `agents-yyyy-mm-dd`; e.g. `agents-2023-03-28`.
- [Create a Github Release](https://github.com/hyperlane-xyz/hyperlane-monorepo/releases/new) with a changelog against the previous version titled `Agents MMMM DD, YYYY`, e.g. `Agents March 28, 2023`.
- Include the agent docker image tag in the description of the release
- Create a summary of change highlights
- Create a "breaking changes" section with any changes required
- Deploy agents with the new image tag (if it makes sense to)

### Releasing packages to NPM

We use [changesets](https://github.com/changesets/changesets) to release to NPM. You can use the `release` script in `package.json` to publish.

For an alpha or beta version, follow the directions [here](https://github.com/changesets/changesets/blob/main/docs/prereleases.md).

### Manually Triggering Docker Builds in CI

To manually trigger Agent or Monorepo Docker builds in CI, you can use the workflows provided in the repository. Here are the steps to do so:

1. **Navigate to the workflow:**
   - For agents, go to the [Rust Docker Workflow](https://github.com/hyperlane-xyz/hyperlane-monorepo/actions/workflows/rust-docker.yml).
   - For the monorepo, go to the [Monorepo Docker Workflow](https://github.com/hyperlane-xyz/hyperlane-monorepo/actions/workflows/monorepo-docker.yml).

2. **Trigger the workflow:**
   - On the workflow page, click on the "Run workflow" button.
   - You may need to select a branch and decide whether to trigger builds for the `arm64` platform.

3. **Wait for the build to complete:**
   - Once triggered, monitor the progress of the build by opening the new workflow run.
     - You may have to refresh the page for it to appear.
   - Check the logs for any errors or issues during the build process.
   - Wait for the `build-and-push-to-gcr` step to complete successfully before using the new image.
