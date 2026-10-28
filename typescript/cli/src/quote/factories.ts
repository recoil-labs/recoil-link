import {
  type AltVM,
  type ChainMetadataForAltVM,
  ProtocolType,
} from '@recoillink/provider-sdk';
import { type FeeReadContext } from '@recoillink/provider-sdk/fee';
import type {
  AnnotatedTx,
  TxReceipt,
} from '@recoillink/provider-sdk/module';
import {
  type IRawWarpQuoteArtifactManager,
  type RawQuoteSigner,
} from '@recoillink/provider-sdk/quote';
import {
  type ChainMap,
  EvmPrivateKeyQuoteSigner,
  EvmQuoteArtifactManager,
  type MultiProvider,
} from '@recoillink/sdk';
import {
  SealevelSigner,
  SvmPrivateKeyQuoteSigner,
  SvmQuoteArtifactManager,
  createRpc,
  resolveFeeSalt,
} from '@recoillink/sealevel-sdk';
import { assert, mustGet, strip0x } from '@recoillink/utils';

/**
 * EVM↔AltVM bridge for warp-quote management. Owns the duality because
 * `@recoillink/sdk` (EVM) does not implement `ProtocolProvider`; this is
 * the only place that imports both `@recoillink/sdk` and
 * `@recoillink/sealevel-sdk`.
 */

/**
 * Protocols `createQuoteArtifactManagerForChain` can build a manager for.
 * Callers can pre-filter chain lists against this set to skip work for
 * unsupported chains; the factory still returns null for the same set, so
 * this is the single source of truth.
 */
export const SUPPORTED_QUOTE_PROTOCOLS: ReadonlySet<ProtocolType> = new Set([
  ProtocolType.Ethereum,
  ProtocolType.Tron,
  ProtocolType.Sealevel,
]);

export interface QuoteArtifactManagerArgs {
  chainMetadata: ChainMetadataForAltVM;
  feeAddress: string;
  context: FeeReadContext;
  multiProvider: MultiProvider;
}

export function createQuoteArtifactManagerForChain(
  args: QuoteArtifactManagerArgs,
): IRawWarpQuoteArtifactManager | null {
  const { chainMetadata, feeAddress, context, multiProvider } = args;

  switch (chainMetadata.protocol) {
    case ProtocolType.Ethereum:
    case ProtocolType.Tron:
      return new EvmQuoteArtifactManager(
        multiProvider,
        chainMetadata.name,
        feeAddress,
        context,
      );

    case ProtocolType.Sealevel: {
      const rpcUrl = chainMetadata.rpcUrls?.[0]?.http;
      assert(
        rpcUrl,
        `No RPC URL configured for SVM chain "${chainMetadata.name}"`,
      );
      return new SvmQuoteArtifactManager(
        createRpc(rpcUrl),
        {
          feeProgramId: feeAddress,
          salt: resolveFeeSalt(chainMetadata.name),
          domainId: chainMetadata.domainId,
        },
        context,
      );
    }

    case ProtocolType.Cosmos:
    case ProtocolType.CosmosNative:
    case ProtocolType.Starknet:
    case ProtocolType.Radix:
    case ProtocolType.Aleo:
    case ProtocolType.Unknown:
      return null;

    default: {
      const exhaustive: never = chainMetadata.protocol;
      throw new Error(
        `Unhandled protocol in createQuoteArtifactManagerForChain: ${String(exhaustive)}`,
      );
    }
  }
}

/**
 * Resolves the per-protocol tx signer for `createWriter` calls. EVM pulls
 * from `multiProvider`; alt-VMs pull from `altVmSigners`.
 */
export function resolveTxSignerForChain(args: {
  chainMetadata: ChainMetadataForAltVM;
  multiProvider: MultiProvider;
  altVmSigners: ChainMap<AltVM.ISigner<AnnotatedTx, TxReceipt>>;
}): unknown {
  const { chainMetadata, multiProvider, altVmSigners } = args;
  switch (chainMetadata.protocol) {
    case ProtocolType.Ethereum:
    case ProtocolType.Tron:
      return multiProvider.getSigner(chainMetadata.name);
    case ProtocolType.Sealevel: {
      const signer = mustGet(altVmSigners, chainMetadata.name);
      if (!(signer instanceof SealevelSigner)) {
        throw new Error(
          `Expected a Sealevel signer for chain "${chainMetadata.name}"`,
        );
      }
      return signer;
    }
    case ProtocolType.Cosmos:
    case ProtocolType.CosmosNative:
    case ProtocolType.Starknet:
    case ProtocolType.Radix:
    case ProtocolType.Aleo:
    case ProtocolType.Unknown:
      return undefined;
    default: {
      const exhaustive: never = chainMetadata.protocol;
      throw new Error(
        `Unhandled protocol in resolveTxSignerForChain: ${String(exhaustive)}`,
      );
    }
  }
}

export function createDefaultQuoteSignerForChain(
  chainMetadata: ChainMetadataForAltVM,
  quoteSignerKey: string,
): RawQuoteSigner | null {
  switch (chainMetadata.protocol) {
    case ProtocolType.Ethereum:
    case ProtocolType.Tron:
      return new EvmPrivateKeyQuoteSigner(quoteSignerKey);

    case ProtocolType.Sealevel:
      return new SvmPrivateKeyQuoteSigner(
        Uint8Array.from(Buffer.from(strip0x(quoteSignerKey), 'hex')),
      );

    case ProtocolType.Cosmos:
    case ProtocolType.CosmosNative:
    case ProtocolType.Starknet:
    case ProtocolType.Radix:
    case ProtocolType.Aleo:
    case ProtocolType.Unknown:
      return null;

    default: {
      const exhaustive: never = chainMetadata.protocol;
      throw new Error(
        `Unhandled protocol in createDefaultQuoteSignerForChain: ${String(exhaustive)}`,
      );
    }
  }
}
