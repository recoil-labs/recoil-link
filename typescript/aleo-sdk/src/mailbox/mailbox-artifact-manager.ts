import {
  type ArtifactReader,
  type ArtifactWriter,
} from '@recoillink/provider-sdk/artifact';
import {
  type DeployedMailboxAddress,
  type IRawMailboxArtifactManager,
  type MailboxType,
  type RawMailboxArtifactConfigs,
} from '@recoillink/provider-sdk/mailbox';
import { assert } from '@recoillink/utils';

import { type AnyAleoNetworkClient } from '../clients/base.js';
import { type AleoSigner } from '../clients/signer.js';
import { type AleoArtifactNetworkConfig } from '../utils/types.js';

import { AleoMailboxReader, AleoMailboxWriter } from './mailbox.js';

/**
 * Aleo Mailbox Artifact Manager implementing IRawMailboxArtifactManager.
 *
 * This manager:
 * - Provides factory methods for creating mailbox readers and writers
 * - Handles mailbox deployment and configuration
 */
export class AleoMailboxArtifactManager implements IRawMailboxArtifactManager {
  constructor(
    private readonly config: AleoArtifactNetworkConfig,
    private readonly aleoClient: AnyAleoNetworkClient,
  ) {}

  async readMailbox(address: string) {
    const reader = this.createReader('mailbox');
    return reader.read(address);
  }

  createReader<T extends MailboxType>(
    type: T,
  ): ArtifactReader<RawMailboxArtifactConfigs[T], DeployedMailboxAddress> {
    const readers: {
      [K in MailboxType]: () => ArtifactReader<
        RawMailboxArtifactConfigs[K],
        DeployedMailboxAddress
      >;
    } = {
      mailbox: () => new AleoMailboxReader(this.aleoClient),
    };

    assert(readers[type], `Mailbox reader for ${type} not found`);
    return readers[type]();
  }

  createWriter<T extends MailboxType>(
    type: T,
    signer: AleoSigner,
  ): ArtifactWriter<RawMailboxArtifactConfigs[T], DeployedMailboxAddress> {
    const writers: {
      [K in MailboxType]: () => ArtifactWriter<
        RawMailboxArtifactConfigs[K],
        DeployedMailboxAddress
      >;
    } = {
      mailbox: () =>
        new AleoMailboxWriter(this.config, this.aleoClient, signer),
    };

    assert(writers[type], `Mailbox writer for ${type} not found`);
    return writers[type]();
  }
}
