import type { Logger } from 'pino';

import { rootLogger, setRootLogger } from '@recoillink/utils';

let logger: Logger = rootLogger;

export async function initializeLogger(
  service: string,
  version: string,
): Promise<Logger> {
  const { createServiceLogger } = await import('@recoillink/utils');
  logger = await createServiceLogger({
    service,
    version,
  });
  setRootLogger(logger);
  return logger;
}

export function getLogger(): Logger {
  return logger;
}

export function setLoggerBindings(bindings: Record<string, string>): void {
  logger.setBindings(bindings);
}
