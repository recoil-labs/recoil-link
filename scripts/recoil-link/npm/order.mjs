// Prints the directories in packages.txt, dependencies before dependents,
// and fails if a listed package depends on one npm users could not install:
// a @recoillink package that is not listed, or a @hyperlane-xyz package
// (those would pull Hyperlane's own SDK into users' installs).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const dirs = readFileSync(join(here, 'packages.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const byName = new Map();
for (const dir of dirs) {
  const pkg = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'));
  if (pkg.private)
    throw new Error(`${dir} is private but listed in packages.txt`);
  byName.set(pkg.name, { dir, pkg });
}

const runtimeDeps = (pkg) =>
  Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
for (const { dir, pkg } of byName.values()) {
  for (const dep of runtimeDeps(pkg)) {
    if (dep.startsWith('@hyperlane-xyz/'))
      throw new Error(`${dir} depends on ${dep}`);
    if (dep.startsWith('@recoillink/') && !byName.has(dep))
      throw new Error(`${dir} depends on ${dep}, which is not in packages.txt`);
  }
}

const done = new Set();
const visit = (name, path = []) => {
  if (done.has(name)) return;
  if (path.includes(name))
    throw new Error(`dependency cycle: ${[...path, name].join(' -> ')}`);
  const { dir, pkg } = byName.get(name);
  for (const dep of runtimeDeps(pkg))
    if (byName.has(dep)) visit(dep, [...path, name]);
  done.add(name);
  console.log(dir);
};
for (const name of byName.keys()) visit(name);
