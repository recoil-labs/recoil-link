import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';

import { type TestChainMetadata } from '@recoillink/provider-sdk/chain';
import { retryAsync } from '@recoillink/utils';

export async function runEvmNode({
  rpcPort,
  chainId,
}: TestChainMetadata): Promise<StartedTestContainer> {
  // Retry container start to handle transient Docker registry 503 errors in CI
  const container = await retryAsync(
    () =>
      new GenericContainer('ghcr.io/foundry-rs/foundry:latest')
        .withEntrypoint([
          'anvil',
          '--host',
          '0.0.0.0',
          '-p',
          rpcPort.toString(),
          '--chain-id',
          chainId.toString(),
        ])
        .withExposedPorts({
          container: rpcPort,
          host: rpcPort,
        })
        .withWaitStrategy(Wait.forLogMessage(/Listening on/))
        .start(),
    3,
    5000,
  );

  return container;
}

// Re-export Tron node utilities from tron-sdk
export {
  runTronNode,
  stopTronNode,
  type TronTestChainMetadata,
} from '@recoillink/tron-sdk/testing';

export { runStarknetNode } from '@recoillink/starknet-sdk/testing';
