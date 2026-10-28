import { chainMetadata } from '@hyperlane-xyz/registry';
import { RouterConfig } from '@recoillink/sdk';

export type HelloWorldConfig = RouterConfig;

// SET DESIRED NETWORKS HERE OR USE THE DEFAULT SET FROM THE REGISTRY
export const prodConfigs = {
  ...chainMetadata,
};
