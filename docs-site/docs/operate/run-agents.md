---
title: Run validators and relayers
---

# Run validators and relayers

Recoil Link's off-chain side is two programs from the [`rust/main`](https://github.com/recoil-labs/recoil-link/tree/main/rust/main) workspace:

| Agent         | Job                                                                                                                                | Count                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Validator** | Watches one chain's Mailbox and signs a checkpoint for every message sent from it; publishes signatures to storage anyone can read | One per chain, per validator operator   |
| **Relayer**   | Reads signatures, delivers prepaid messages to their destinations, pays destination gas                                            | One or more; delivery is permissionless |

Recoil Labs runs both today. The full production setup (GCP, Cloud KMS keys, GCS signature storage, alerts) is in [`docs/recoil-link/production-deployment.md`](https://github.com/recoil-labs/recoil-link/blob/main/docs/recoil-link/production-deployment.md).

## Running locally against the testnets

```bash
cd recoil-link/rust/main && cargo build --release --bin validator --bin relayer
cd ../.. && rlink registry agent-config --chains sepolia basesepolia --out configs/recoil-link/testnet/agent-config.json
scripts/recoil-link/testnet/validator.sh sepolia     # one per chain
scripts/recoil-link/testnet/relayer.sh
```

The scripts read keys from `~/.recoil-link/keys/` and run each agent from its own working directory, so only Recoil Link's config is loaded.

## Rules that matter

- **Never run the agents from `rust/main`** or in an image that copies `rust/main/config`: that directory holds Hyperlane's chain configs, and the agents load every JSON in `./config`.
- **Validators need private RPCs.** They refuse public endpoints unless `allowPublicRpcs` is set.
- **One instance per relayer key.** Two relayers sharing a key race each other's nonces.
- **Keys:** hex keys for local testing; Cloud KMS (`type: gcp`) or AWS KMS in production.

## Becoming a validator

Adding a validator means adding its address to each chain's ISM, which only the contract owner (the treasury Safe) can do. Contact Recoil Labs if you want to run one.
