import { ChainName, IRouterAdapter, TypedTransaction } from '@recoillink/sdk';
import { Address } from '@recoillink/utils';

export interface IHelloWorldAdapter extends IRouterAdapter {
  populateSendHelloTx: (
    destination: ChainName,
    message: string,
    value: string,
    sender: Address,
  ) => Promise<TypedTransaction>;

  sentStat: (destination: ChainName) => Promise<number>;
}
