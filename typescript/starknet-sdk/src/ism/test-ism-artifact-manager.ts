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
import { getIsmType, getNoopIsmConfig } from './ism-query.js';
import { getCreateNoopIsmTx } from './ism-tx.js';

export class StarknetTestIsmReader implements ArtifactReader<
  RawIsmArtifactConfigs['testIsm'],
  DeployedIsmAddress
> {
  constructor(protected readonly provider: StarknetProvider) {}

  async read(
    address: string,
  ): Promise<
    ArtifactDeployed<RawIsmArtifactConfigs['testIsm'], DeployedIsmAddress>
  > {
    assert(
      (await getIsmType(this.provider.getRawProvider(), address)) ===
        AltVM.IsmType.TEST_ISM,
      `Expected a verified Starknet noop ISM at ${address}`,
    );
    const noop = getNoopIsmConfig(address);
    return {
      artifactState: ArtifactState.DEPLOYED,
      config: { type: AltVM.IsmType.TEST_ISM },
      deployed: { address: noop.address },
    };
  }
}

export class StarknetTestIsmWriter
  extends StarknetTestIsmReader
  implements
    ArtifactWriter<RawIsmArtifactConfigs['testIsm'], DeployedIsmAddress>
{
  constructor(
    provider: StarknetProvider,
    private readonly signer: StarknetSigner,
  ) {
    super(provider);
  }

  async create(
    artifact: ArtifactNew<RawIsmArtifactConfigs['testIsm']>,
  ): Promise<
    [
      ArtifactDeployed<RawIsmArtifactConfigs['testIsm'], DeployedIsmAddress>,
      TxReceipt[],
    ]
  > {
    const tx = getCreateNoopIsmTx();
    const receipt = await this.signer.sendAndConfirmTransaction(tx);
    const ismAddress = receipt.contractAddress;
    assert(ismAddress, 'failed to deploy Starknet noop ISM');
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
      RawIsmArtifactConfigs['testIsm'],
      DeployedIsmAddress
    >,
  ): Promise<AnnotatedTx[]> {
    return [];
  }
}
