# Deploying Recoil Link agents on GCP

Audience: whoever runs RecoilPay's infrastructure. Status: 2026-10-31, written
for the testnets (Sepolia, Base Sepolia; OP Sepolia and Polygon Amoy next). The
same layout carries to mainnet with the changes in [Before mainnet](#before-mainnet).

Recoil Link's contracts are already deployed (addresses in
[recoil-labs/recoil-link-registry](https://github.com/recoil-labs/recoil-link-registry)).
What has to run is the off-chain side. Until it does, Recoil Link proofs depend on
a developer laptop, and RecoilPay PR #53 (proofs over Recoil Link) should not be
deployed.

## What runs

| Component             | Count         | What it does                                                                            | Needs                                                                       |
| --------------------- | ------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Validator**         | one per chain | Watches the chain's Mailbox and signs a checkpoint for every message sent from it       | Its signing key, RPC for that chain, write access to the signature bucket   |
| **Relayer**           | one           | Reads checkpoints, delivers each prepaid message to its destination, pays the gas there | A key funded on every chain, RPC for every chain, read access to the bucket |
| **Signature bucket**  | one           | Where validators publish signatures; the relayer (anyone's) reads them                  | GCS, public read                                                            |
| **Gas price updater** | one job       | Keeps the IGP gas oracles at real prices + margin                                       | **Not built yet**; testnets run on the prices set at deploy                 |

Neither agent takes inbound traffic. Each serves Prometheus metrics on
`HYP_METRICSPORT` (keep it internal). The relayer and each validator must run as
**exactly one instance**: two relayers with the same key race each other's nonces.

## Where to run them

The agents keep a RocksDB database (`HYP_DB`) and need CPU all the time, not
per request.

- **Recommended to start: one small GCE VM** (e.g. `e2-standard-2`) with a
  persistent disk for the databases, running the containers (Docker or
  Container-Optimized OS). The VM's service account provides KMS and GCS access.
- **Later: GKE (Autopilot is fine)**, one StatefulSet per agent with a persistent
  volume and Workload Identity.
- **Cloud Run is a poor fit**: the filesystem is ephemeral (the relayer would
  re-index from the deployment block after every restart) and CPU is throttled
  between requests unless `--no-cpu-throttling --min-instances=1
--max-instances=1` is set. Usable for a trial, not the target.

## 1. Build the image

From the repository root (`docker buildx` or `DOCKER_BUILDKIT=1`):

```sh
docker build -f rust/Dockerfile -t REGION-docker.pkg.dev/PROJECT/recoil-link/agent:$(git rev-parse --short HEAD) .
docker push REGION-docker.pkg.dev/PROJECT/recoil-link/agent:$(git rev-parse --short HEAD)
```

The image holds `validator`, `relayer` and `scraper` in `/app`. **Its `/app/config`
is deliberately empty**: the agents load every JSON in that directory, and the
upstream Dockerfile copied Hyperlane's chain configs there. Supply Recoil Link's
agent config at run time (step 4). Never run the agents from `rust/main`, whose
`config/` holds Hyperlane's chains.

`/app/app-contexts` (upstream metric labels for Hyperlane apps) is still copied;
it only names metrics and can be ignored.

## 2. Keys

Agents sign with **Cloud KMS** keys (`type: gcp`): the private key never leaves
KMS. Create keys with purpose `ASYMMETRIC_SIGN` and algorithm
`EC_SIGN_SECP256K1_SHA256`, then grant the agents' service account
`roles/cloudkms.signerVerifier` on them.

| Key       | Used for                                                     | Funded on                                                |
| --------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Validator | Signing checkpoints; one-time announce transaction per chain | Every chain it validates (a little gas for the announce) |
| Relayer   | Delivering messages                                          | **Every chain**, continuously (see alerts)               |

The agent derives each key's address; read it from the agent log or KMS public
key before funding.

**Testnet caveat.** The testnets' security modules trust validator
`0x9Fc49dA0660064Be72392fbDF9ed2bdF610969bB`, a hex key. A KMS validator has a
different address, so moving to KMS means a new default ISM on every chain, set
by the treasury Safe. For the testnets either keep the existing key (store it
in **Secret Manager** and pass it as `HYP_VALIDATOR_KEY` with
`HYP_VALIDATOR_TYPE=hexKey`) or plan the ISM change. On mainnet, use KMS from
the first deployment.

## 3. Signature bucket

```sh
gcloud storage buckets create gs://recoil-link-testnet-checkpoints --location=REGION --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://recoil-link-testnet-checkpoints \
  --member=allUsers --role=roles/storage.objectViewer          # anyone may read signatures
gcloud storage buckets add-iam-policy-binding gs://recoil-link-testnet-checkpoints \
  --member=serviceAccount:AGENTS_SA --role=roles/storage.objectAdmin
```

One folder per origin chain (`sepolia/`, `basesepolia/`, …). Signatures are
public by design; nothing secret is written there.

## 4. Configuration

**Agent config.** `configs/recoil-link/<env>/agent-config.json`, generated from
the registry:

```sh
rlink registry agent-config --chains sepolia basesepolia --out configs/recoil-link/testnet/agent-config.json
```

Mount it into the container at `/app/config/agent-config.json`. It holds chain
metadata and contract addresses, nothing secret.

**RPCs.** Validators refuse public RPC endpoints unless `allowPublicRpcs` is set,
and production should not set it. Use a private provider per chain and pass the
URLs from Secret Manager, never in the committed config:

```
HYP_CHAINS_SEPOLIA_CUSTOMRPCURLS=https://<private-sepolia-endpoint>
HYP_CHAINS_BASESEPOLIA_CUSTOMRPCURLS=https://<private-base-sepolia-endpoint>
```

`CUSTOMRPCURLS` takes a comma-separated list and replaces the config's `rpcUrls`.

### Validator (one container per chain)

```
CONFIG_FILES=/app/config/agent-config.json
HYP_ORIGINCHAINNAME=sepolia                      # the chain this validator watches
HYP_DB=/data/validator-sepolia
HYP_METRICSPORT=9090

HYP_VALIDATOR_TYPE=gcp
HYP_VALIDATOR_KEYVERSIONNAME=projects/P/locations/L/keyRings/R/cryptoKeys/validator/cryptoKeyVersions/1
# Signer for the one-time announce transaction on this chain
HYP_CHAINS_SEPOLIA_SIGNER_TYPE=gcp
HYP_CHAINS_SEPOLIA_SIGNER_KEYVERSIONNAME=projects/P/locations/L/keyRings/R/cryptoKeys/validator/cryptoKeyVersions/1

HYP_CHECKPOINTSYNCER_TYPE=gcs
HYP_CHECKPOINTSYNCER_BUCKET=recoil-link-testnet-checkpoints
HYP_CHECKPOINTSYNCER_FOLDER=sepolia
HYP_CHECKPOINTSYNCER_USEAPPLICATIONDEFAULT=true  # VM / Workload Identity credentials

HYP_CHAINS_SEPOLIA_CUSTOMRPCURLS=<from Secret Manager>
```

Command: `./validator`. On first start it announces its bucket location on-chain
(once per location; costs a little gas).

### Relayer (one container)

```
CONFIG_FILES=/app/config/agent-config.json
HYP_RELAYCHAINS=sepolia,basesepolia              # every chain Recoil Link serves
HYP_DB=/data/relayer
HYP_METRICSPORT=9090

HYP_DEFAULTSIGNER_TYPE=gcp
HYP_DEFAULTSIGNER_KEYVERSIONNAME=projects/P/locations/L/keyRings/R/cryptoKeys/relayer/cryptoKeyVersions/1

# Deliver only messages that prepaid gas through the Recoil Link IGP.
HYP_GASPAYMENTENFORCEMENT=[{"type":"minimum","payment":"1"}]
HYP_ALLOWLOCALCHECKPOINTSYNCERS=false

HYP_CHAINS_SEPOLIA_CUSTOMRPCURLS=<from Secret Manager>
HYP_CHAINS_BASESEPOLIA_CUSTOMRPCURLS=<from Secret Manager>
```

Command: `./relayer`.

The local equivalents (hex keys, local storage) are
`scripts/recoil-link/testnet/validator.sh` and `relayer.sh`.

## 5. Monitoring and alerts

Scrape `:9090/metrics` on each agent. Alert on:

- **Relayer balance** on every chain below a threshold (e.g. 0.05 ETH). An empty
  relayer stops all deliveries to that chain. `typescript/keyfunder` can top it up
  from a funding wallet.
- **Relayer queue** growing for more than ~10 minutes: messages are not being
  delivered.
- **Validator** not signing new checkpoints while its chain's Mailbox has new
  messages.
- Container restarts and RPC error rates.

Check metric names against a running agent's `/metrics` before writing alert rules.

## 6. Cutover from the laptop

1. Start the cloud validators (with the **same** validator key on testnet, see
   step 2). They announce `gs://…` locations next to the existing local ones.
2. Start the cloud relayer.
3. Stop the laptop agents.
4. Prove it: `scripts/recoil-link/testnet/oracle-proof-test.sh` fills on Base
   Sepolia and waits until Sepolia's oracle reports the fill proven.
5. Then RecoilPay PR #53 can be deployed.

## Before mainnet

- **Audit** of everything Recoil Link changed from upstream Hyperlane.
- **Three or more validators**, run by different parties, with a matching
  threshold (e.g. 2 of 3) in every chain's ISM.
- **KMS keys** for every agent from the start; **deployer and gas-oracle keys
  separate** from the treasury Safe's signers.
- **Treasury Safe with several signers**; the address does not change.
- **Gas price updater** running, starting from `typescript/infra/src/config/gas-oracle.ts`
  and the policy in `typescript/sdk/src/consts/recoilLinkFees.ts`.
- **Per-chain `maxProtocolFee`** computed from live prices at deploy (immutable on EVM).

## Not yet exercised

The `gcp` signer and `gcs` checkpoint syncer come from upstream and have not
been run by Recoil Link yet. Bring them up on testnet first and watch the
validator's first announce and checkpoint before relying on them.
