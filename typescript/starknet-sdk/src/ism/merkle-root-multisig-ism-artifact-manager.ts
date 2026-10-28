import { AltVM } from '@recoillink/provider-sdk';
import {
  type ArtifactDeployed,
  type ArtifactNew,
  type ArtifactReader,
  ArtifactState,
  type ArtifactWriter,
} from '@recoillink/provider-sdk/artifact';
import {
  type DeployedIsmAddress,
  type RawIsmArtifactConfigs,
} from '@recoillink/provider-sdk/ism';
import {
  type AnnotatedTx,
  type TxReceipt,
} from '@recoillink/provider-sdk/module';
import { assert } from '@recoillink/utils';

import { StarknetProvider } from '../clients/provider.js';
import { StarknetSigner } from '../clients/signer.js';
import { getMerkleRootMultisigIsmConfig } from './ism-query.js';
import { getCreateMerkleRootMultisigIsmTx } from './ism-tx.js';

export class StarknetMerkleRootMultisigIsmReader implements ArtifactReader<
  RawIsmArtifactConfigs['merkleRootMultisigIsm'],
  DeployedIsmAddress
> {
  constructor(protected readonly provider: StarknetProvider) {}

  async read(
    address: string,
  ): Promise<
    ArtifactDeployed<
      RawIsmArtifactConfigs['merkleRootMultisigIsm'],
      DeployedIsmAddress
    >
  > {
    const ism = await getMerkleRootMultisigIsmConfig(
      this.provider.getRawProvider(),
      address,
    );
    return {
      artifactState: ArtifactState.DEPLOYED,
      config: {
        type: AltVM.IsmType.MERKLE_ROOT_MULTISIG,
        validators: ism.validators,
        threshold: ism.threshold,
      },
      deployed: { address: ism.address },
    };
  }
}

export class StarknetMerkleRootMultisigIsmWriter
  extends StarknetMerkleRootMultisigIsmReader
  implements
    ArtifactWriter<
      RawIsmArtifactConfigs['merkleRootMultisigIsm'],
      DeployedIsmAddress
    >
{
  constructor(
    provider: StarknetProvider,
    private readonly signer: StarknetSigner,
  ) {
    super(provider);
  }

  async create(
    artifact: ArtifactNew<RawIsmArtifactConfigs['merkleRootMultisigIsm']>,
  ): Promise<
    [
      ArtifactDeployed<
        RawIsmArtifactConfigs['merkleRootMultisigIsm'],
        DeployedIsmAddress
      >,
      TxReceipt[],
    ]
  > {
    const tx = getCreateMerkleRootMultisigIsmTx(
      this.signer.getSignerAddress(),
      {
        validators: artifact.config.validators,
        threshold: artifact.config.threshold,
      },
    );
    const receipt = await this.signer.sendAndConfirmTransaction(tx);
    const ismAddress = receipt.contractAddress;
    assert(ismAddress, 'failed to deploy Starknet merkle root multisig ISM');
    return [
      {
        artifactState: ArtifactState.DEPLOYED,
        config: artifact.config,
        deployed: { address: ismAddress },
      },
      [receipt],
    ];
  }

  async update(
    _artifact: ArtifactDeployed<
      RawIsmArtifactConfigs['merkleRootMultisigIsm'],
      DeployedIsmAddress
    >,
  ): Promise<AnnotatedTx[]> {
    return [];
  }
}
