---
title: CLI (rlink)
---

# CLI: `rlink`

`rlink` deploys and inspects Recoil Link and sends test messages. It is not on npm yet; build it from source as in the [Quickstart](../quickstart.md).

It reads chain metadata and addresses from the [registry](./registry.md) (`--registry` to add local or other registries) and signs with `HYP_KEY` or `--key`.

## Messages

| Command                                                                               | Does                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `rlink send message --origin <chain> --destination <chain> [--body <text>] [--quick]` | Send a test message to the destination's test recipient; waits for delivery unless `--quick` |
| `rlink status --origin <chain> --id <messageId>`                                      | Check delivery (or `--dispatchTx <hash>`)                                                    |
| `rlink message decode --bytes <hex>`                                                  | Decode a packed message                                                                      |
| `rlink message encode`                                                                | Build a packed message                                                                       |
| `rlink address to-bytes32 -a <address>` / `from-bytes32`                              | Convert between addresses and the `bytes32` form messages use                                |

Chain names are registry names: `sepolia`, `basesepolia`, `optimismsepolia`, `bsctestnet`.

## Registry

| Command                                                       | Does                                      |
| ------------------------------------------------------------- | ----------------------------------------- |
| `rlink registry list`                                         | Chains in the registry                    |
| `rlink registry addresses --name <chain>`                     | Recoil Link contract addresses on a chain |
| `rlink registry rpc --chain <chain>`                          | A public RPC for a chain                  |
| `rlink registry agent-config --chains <a> <b> … --out <file>` | Agent config for validators and relayers  |

## Deployment

| Command                                             | Does                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `rlink core init`                                   | Write a core config (ISM, hooks)                              |
| `rlink core deploy --chain <chain> --config <file>` | Deploy the core contracts                                     |
| `rlink core read` / `check` / `apply`               | Read, compare with a config, or update an on-chain deployment |
| `rlink ism …`, `rlink hook …`                       | Deploy or read individual security modules and hooks          |
| `rlink validator address` / `check`                 | Validator key address; check its announcement                 |

`rlink <command> --help` lists every option.
