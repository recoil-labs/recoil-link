import { Logger, rootLogger } from '@recoillink/utils';

export const widgetLogger: Logger = rootLogger.child({ module: 'widgets' });
