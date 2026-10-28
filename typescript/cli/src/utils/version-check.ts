import latestVersion from 'latest-version';

import { log } from '../logger.js';
import { VERSION } from '../version.js';

export async function checkVersion() {
  const argv = process.argv;
  // The latestVersion lib (or one of its deps) is confused by the --registry value
  // in the CLI's args, so we need to clear the args before calling it
  process.argv = [];
  let currentVersion: string;
  try {
    currentVersion = await latestVersion('@recoillink/cli');
  } catch {
    // Not published (yet) or registry unreachable: never block the CLI on this.
    return;
  } finally {
    process.argv = argv;
  }
  if (VERSION < currentVersion) {
    log(`Your CLI version: ${VERSION}, latest version: ${currentVersion}`);
  }
}
