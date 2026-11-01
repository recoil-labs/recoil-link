---
title: Validator sets
---

# Validator sets

What each network's **default ISM** accepts today. A message from any origin is delivered on these chains if it carries signatures from `threshold` of the listed validators.

| Network      | Default ISM                                  | Type                | Validators                                                 | Threshold |
| ------------ | -------------------------------------------- | ------------------- | ---------------------------------------------------------- | --------- |
| Sepolia      | `0x09942Ad735412c6a7D66Da91b0A4cA2D4527Ce5C` | Message-id multisig | `0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB` (Recoil Labs) | 1         |
| Base Sepolia | `0xE5bBd2dB1c1aAbaF61D58F9C884596A8A43a5BCe` | Message-id multisig | `0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB` (Recoil Labs) | 1         |
| OP Sepolia   | `0x98874942Cf209c50b381953AC245715cF6b04fcf` | Message-id multisig | `0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB` (Recoil Labs) | 1         |
| BSC testnet  | `0xd26fe788Ea36C42c0e089415EF22e5aEC7f00B92` | Message-id multisig | `0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB` (Recoil Labs) | 1         |

Check on-chain:

```bash
cast call --rpc-url https://ethereum-sepolia.publicnode.com \
  0x09942Ad735412c6a7D66Da91b0A4cA2D4527Ce5C 'validatorsAndThreshold(bytes)(address[],uint8)' 0x
```

Where each validator publishes its signatures is recorded on-chain in the network's `ValidatorAnnounce` contract ([Networks](./networks.md)).

A single validator is a testnet setup. Before mainnet the sets grow to several independent operators with a matching threshold: see [Security](../operate/security.md).
