// Sets every published package to its next Recoil-only release version, for a
// release between upstream syncs (docs/recoil-link/npm-publishing.md):
//
//   45.1.0           -> 45.1.1-recoil.1   (next patch, so it sorts after 45.1.0
//                                          and before upstream's next release)
//   45.1.1-recoil.1  -> 45.1.1-recoil.2
//
// Then regenerates the files the build derives from versions (contract and CLI
// version constants), so the tree stays consistent.
//
//   node scripts/recoil-link/npm/recoil-version.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();
const dirs = readFileSync(
  join(root, 'scripts/recoil-link/npm/packages.txt'),
  'utf8',
)
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

function next(version) {
  const recoil = version.match(/^(\d+\.\d+\.\d+)-recoil\.(\d+)$/);
  if (recoil) return `${recoil[1]}-recoil.${Number(recoil[2]) + 1}`;
  const plain = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!plain) throw new Error(`unexpected version ${version}`);
  return `${plain[1]}.${plain[2]}.${Number(plain[3]) + 1}-recoil.1`;
}

for (const dir of dirs) {
  const file = join(root, dir, 'package.json');
  const text = readFileSync(file, 'utf8');
  const { name, version } = JSON.parse(text);
  const to = next(version);
  // Edit the one line, so the file's formatting is untouched.
  const updated = text.replace(/^(\s*"version":\s*")[^"]+(")/m, `$1${to}$2`);
  if (updated === text) throw new Error(`no version line in ${file}`);
  writeFileSync(file, updated);
  console.log(`${name.padEnd(28)} ${version} -> ${to}`);
}

// Version constants the build would otherwise rewrite on the next build.
for (const pkg of ['solidity', 'typescript/cli']) {
  execFileSync('pnpm', ['run', 'version:update'], {
    cwd: join(root, pkg),
    stdio: 'ignore',
  });
}
console.log(
  'regenerated solidity PackageVersioned.sol, core-utils/index.ts and cli src/version.ts',
);
