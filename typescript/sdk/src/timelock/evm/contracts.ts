import { TimelockController__factory } from '@recoillink/core';

export const evmTimelockFactories = {
  TimelockController: new TimelockController__factory(),
} as const;

export type EvmTimelockFactories = typeof evmTimelockFactories;
