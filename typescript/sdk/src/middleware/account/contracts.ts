import { InterchainAccountRouter__factory } from '@recoillink/core';

export const interchainAccountFactories = {
  interchainAccountRouter: new InterchainAccountRouter__factory(),
};

export type InterchainAccountFactories = typeof interchainAccountFactories;
