import { ChainName, GetCallRemoteSettings } from '@recoillink/sdk';
import { CallData } from '@recoillink/utils';

import { GovernanceType } from '../governanceTypes.js';

export enum SubmissionType {
  MANUAL = 0,
  SAFE = 1,
  SIGNER = 2,
}

export interface AnnotatedCallData extends CallData {
  submissionType?: SubmissionType;
  description: string;
  expandedDescription?: string;
  callRemoteArgs?: GetCallRemoteSettings;
  governanceType?: GovernanceType;
}

export interface InferredCall {
  type: SubmissionType;
  chain: ChainName;
  call: AnnotatedCallData;
  callRemoteArgs?: GetCallRemoteSettings;
}
