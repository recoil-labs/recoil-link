---
title: Registry
---

# Registry

The [Recoil Link registry](https://github.com/recoil-labs/recoil-link-registry) is a public GitHub repository holding:

- **`chains/<name>/metadata.yaml`**: chain id, domain id, RPC URLs, block explorers, native token, block times. Around 350 chains.
- **`chains/<name>/addresses.yaml`**: Recoil Link's deployed contracts, only for the chains Recoil Link runs on ([Networks](./networks.md)).

`rlink`, the SDK and the agents read it by default. Tools can fetch it directly:

```text
https://raw.githubusercontent.com/recoil-labs/recoil-link-registry/main/chains/sepolia/addresses.yaml
```

The chain metadata is inherited from the Hyperlane registry (MIT). Hyperlane's own deployment addresses have been removed, so Recoil Link tooling never uses Hyperlane's contracts by accident.
