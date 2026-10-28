import {
  FeeType,
  type RegressiveFeeConfig,
} from '@recoillink/provider-sdk/fee';

import { SvmLeafFeeReader, SvmLeafFeeWriter } from './leaf-fee.js';

export class SvmRegressiveFeeReader extends SvmLeafFeeReader<RegressiveFeeConfig> {
  protected readonly feeType = FeeType.regressive;
}

export class SvmRegressiveFeeWriter extends SvmLeafFeeWriter<RegressiveFeeConfig> {
  protected readonly feeType = FeeType.regressive;
}
