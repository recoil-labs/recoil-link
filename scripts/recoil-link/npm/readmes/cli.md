# @recoillink/cli

`rlink`, the command-line tool for [Recoil Link](https://github.com/recoil-labs/recoil-link): send test messages, check delivery, and read the registry.

## Install

```bash
npm install -g @recoillink/cli
rlink --help
```

Needs Node.js 22+.

## Send a message

```bash
read -s "HYP_KEY?Test wallet private key: " && export HYP_KEY
rlink send message --origin sepolia --destination basesepolia --body "Hello from Sepolia"
```

The CLI quotes the fee, sends the message to a test recipient and waits until it is delivered. Other commands: `rlink status`, `rlink registry addresses --name <chain>`, `rlink message decode`.

## Status

Recoil Link is on **testnet** (Sepolia, Base Sepolia, OP Sepolia, BSC testnet), secured by one validator. Don't move real value with it yet.

## Links

- [Recoil Link on GitHub](https://github.com/recoil-labs/recoil-link)
- [Documentation](https://github.com/recoil-labs/recoil-link/tree/main/docs-site/docs)
- [Examples](https://github.com/recoil-labs/recoil-link-examples)

## License

Apache-2.0. Recoil Link is built on [Hyperlane](https://github.com/hyperlane-xyz/hyperlane-monorepo); see the repository's NOTICE.
