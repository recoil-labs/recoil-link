---
title: Local development (Anvil)
---

# Local development with Anvil

Run Recoil Link on two local chains and send messages between them. No faucets, no testnet, deliveries in seconds. You need [Foundry](https://getfoundry.sh/) (for `anvil`, `cast`, `forge`) and the [`rlink` CLI](../quickstart.md#1-install-the-cli).

## 1. Start two chains

In two terminals:

```bash
anvil --port 8545 --chain-id 31337
anvil --port 8546 --chain-id 31338
```

## 2. Describe them in a local registry

`rlink` reads chain metadata from a registry. Create one in a folder of your project:

```bash
for n in 1 2; do
  mkdir -p local-registry/chains/anvil$n
  cat > local-registry/chains/anvil$n/metadata.yaml <<EOF
name: anvil$n
displayName: Anvil $n
chainId: $((31336 + n))
domainId: $((31336 + n))
protocol: ethereum
rpcUrls:
  - http: http://127.0.0.1:$((8544 + n))
nativeToken:
  name: Ether
  symbol: ETH
  decimals: 18
blocks:
  confirmations: 1
  reorgPeriod: 0
  estimateBlockTime: 1
isTestnet: true
EOF
done
```

## 3. Write a local core config

On a local chain there are no validators, so use a **test security module that accepts every message**. Never use `testIsm` outside local development.

```yaml title="core-config.yaml"
owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' # Anvil account 0
defaultIsm:
  type: testIsm
defaultHook:
  type: merkleTreeHook
requiredHook:
  type: protocolFee
  owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  beneficiary: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  protocolFee: '0'
  maxProtocolFee: '1000000000000000000'
```

There is no gas paymaster in this config, so messages cost nothing locally.

## 4. Deploy to both chains

Sign with Anvil's first default account:

```bash
export HYP_KEY=$(cast wallet private-key --mnemonic "test test test test test test test test test test test junk")
rlink core deploy --chain anvil1 --config core-config.yaml --registry ./local-registry --yes
rlink core deploy --chain anvil2 --config core-config.yaml --registry ./local-registry --yes
```

Each takes a few seconds. The CLI writes the addresses to `local-registry/chains/anvil<n>/addresses.yaml`. On fresh Anvil chains the Mailbox gets the **same address on both** (same deployer, same nonces); that is expected.

## 5. Send a message

```bash
rlink send message --origin anvil1 --destination anvil2 --body "Hello local" --relay --registry ./local-registry --yes
```

```text
Message ID: 0xeff00ee2…c62139
Attempting self-relay of message
Message was self-relayed!
Delivery time: 6s
```

`--relay` makes the CLI deliver the message itself instead of waiting for a relayer, which you do not run locally.

## 6. Your own contracts

Deploy the [Sender](../build/send-messages.md) on `anvil1` and the [Receiver](../build/receive-messages.md) on `anvil2` with the Mailbox address from `addresses.yaml`, send through the Sender, then deliver with `rlink status`:

```bash
MAILBOX=$(grep '^mailbox:' local-registry/chains/anvil1/addresses.yaml | cut -d'"' -f2)
SENDER=$(forge create src/Sender.sol:Sender --rpc-url http://127.0.0.1:8545 --private-key $HYP_KEY \
  --broadcast --constructor-args $MAILBOX | awk '/Deployed to:/ {print $3}')
RECEIVER=$(forge create src/Receiver.sol:Receiver --rpc-url http://127.0.0.1:8546 --private-key $HYP_KEY \
  --broadcast --constructor-args $MAILBOX 31337 $SENDER | awk '/Deployed to:/ {print $3}')

TX=$(cast send --rpc-url http://127.0.0.1:8545 --private-key $HYP_KEY --json $SENDER \
  'send(uint32,address,bytes)' 31338 $RECEIVER $(cast from-utf8 "hello from Sender") | jq -r .transactionHash)

rlink status --origin anvil1 --dispatchTx $TX --relay --registry ./local-registry --yes
```

The Receiver emits `Received(31337, <Sender as bytes32>, "hello from Sender")` on `anvil2`.

## Next

- [Testing with MockMailbox](../build/testing.md): the same flow inside Foundry tests, without running chains.
- Move to [testnet](../reference/networks.md): same contracts, real Mailbox addresses, a fee from `quoteDispatch`.
