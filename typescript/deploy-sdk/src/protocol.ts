import {
  ProtocolType,
  hasProtocol,
  registerProtocol,
} from '@recoillink/provider-sdk';
import { rootLogger } from '@recoillink/utils';

export async function loadProtocolProviders(
  neededProtocols: Set<ProtocolType>,
) {
  for (const protocol of neededProtocols) {
    if (hasProtocol(protocol)) {
      rootLogger.debug(`${protocol} already loaded`);
      continue;
    }
    switch (protocol) {
      case ProtocolType.CosmosNative: {
        const { CosmosNativeProtocolProvider } =
          await import('@recoillink/cosmos-sdk');
        registerProtocol(protocol, () => new CosmosNativeProtocolProvider());
        break;
      }
      case ProtocolType.Radix: {
        const { RadixProtocolProvider } = await import('@recoillink/radix-sdk');
        registerProtocol(protocol, () => new RadixProtocolProvider());
        break;
      }
      case ProtocolType.Aleo: {
        const { AleoProtocolProvider } = await import('@recoillink/aleo-sdk');
        registerProtocol(protocol, () => new AleoProtocolProvider());
        break;
      }
      case ProtocolType.Sealevel: {
        const { SealevelProtocolProvider } =
          await import('@recoillink/sealevel-sdk');
        registerProtocol(protocol, () => new SealevelProtocolProvider());
        break;
      }
      case ProtocolType.Starknet: {
        const { StarknetProtocolProvider } =
          await import('@recoillink/starknet-sdk/runtime');
        registerProtocol(protocol, () => new StarknetProtocolProvider());
        break;
      }
    }
  }
}
