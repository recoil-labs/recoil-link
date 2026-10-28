import type { DispatchEvent, ProcessEvent } from '@recoillink/core/mailbox';

export { DispatchEvent, ProcessEvent };

export type HyperlaneLifecyleEvent = ProcessEvent | DispatchEvent;
