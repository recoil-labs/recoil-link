// Recoil Link's own package.json settings, layered on upstream's files.
// Run by rebrand.sh, so an upstream merge can take upstream's side of any
// package.json conflict and get these back automatically. Idempotent.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

// Not published to npm (docs/recoil-link/npm-publishing.md).
const PRIVATE = [
  'typescript/helloworld',
  'typescript/metrics',
  'typescript/rebalancer',
  'typescript/relayer',
  'typescript/warp-widget',
  'typescript/widgets',
];

// Runtime dependencies that would pull Hyperlane's own SDK into users' installs.
const REMOVE_DEPENDENCIES = {
  'typescript/tron-sdk': ['@hyperlane-xyz/registry'],
};

// Extra export entries, placed after an existing key.
const ADD_EXPORTS = {
  'typescript/sdk': {
    after: './core/*',
    key: './consts/registry',
    value: {
      types: './dist/consts/registry.d.ts',
      default: './dist/consts/registry.js',
    },
  },
};

// Published packages (scripts/recoil-link/npm/packages.txt): what npm shows.
const PUBLISHED = readFileSync(
  join(root, 'scripts/recoil-link/npm/packages.txt'),
  'utf8',
)
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

// Descriptions that name upstream's on-chain modules, which Recoil Link doesn't deploy.
const DESCRIPTIONS = {
  'typescript/aleo-sdk': 'Recoil Link TypeScript SDK for Aleo',
  'typescript/cosmos-sdk': 'Recoil Link TypeScript SDK for Cosmos',
  'typescript/cosmos-types': 'Recoil Link TypeScript SDK types for Cosmos',
  'typescript/radix-sdk': 'Recoil Link TypeScript SDK for Radix',
};

/** A copy of `obj` with `key: value` inserted after `afterKey` (or at the end). */
function insertAfter(obj, afterKey, key, value) {
  const out = {};
  let placed = false;
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) continue;
    out[k] = v;
    if (k === afterKey) {
      out[key] = value;
      placed = true;
    }
  }
  if (!placed) out[key] = value;
  return out;
}

const changed = [];
const dirs = new Set([
  ...PRIVATE,
  ...Object.keys(REMOVE_DEPENDENCIES),
  ...Object.keys(ADD_EXPORTS),
  ...PUBLISHED,
]);
for (const dir of dirs) {
  const file = join(root, dir, 'package.json');
  if (!existsSync(file)) {
    console.log(
      `    ${dir}: no package.json upstream any more; check the policy`,
    );
    continue;
  }
  const before = readFileSync(file, 'utf8');
  let pkg = JSON.parse(before);

  if (PRIVATE.includes(dir) && pkg.private !== true)
    pkg = insertAfter(pkg, 'version', 'private', true);

  for (const dep of REMOVE_DEPENDENCIES[dir] ?? []) {
    if (pkg.dependencies && dep in pkg.dependencies)
      delete pkg.dependencies[dep];
  }

  if (PUBLISHED.includes(dir)) {
    // npm search and package pages: our name in place of upstream's.
    if (
      Array.isArray(pkg.keywords) &&
      pkg.keywords.some((k) => /^hyperlane$/i.test(k))
    ) {
      pkg.keywords = [
        ...new Set(
          pkg.keywords.map((k) => (/^hyperlane$/i.test(k) ? 'recoil-link' : k)),
        ),
      ];
    }
    if (DESCRIPTIONS[dir] && pkg.description !== DESCRIPTIONS[dir])
      pkg.description = DESCRIPTIONS[dir];
  }

  const add = ADD_EXPORTS[dir];
  if (add && pkg.exports && !(add.key in pkg.exports)) {
    pkg.exports = insertAfter(pkg.exports, add.after, add.key, add.value);
  }

  const after = `${JSON.stringify(pkg, null, 2)}\n`;
  if (after !== before) {
    writeFileSync(file, after);
    changed.push(join(dir, 'package.json'));
  }
}

if (changed.length > 0) {
  const oxfmt = join(root, 'node_modules/.bin/oxfmt');
  if (existsSync(oxfmt))
    execFileSync(
      oxfmt,
      ['--ignore-path', '.gitignore', '--write', ...changed],
      { cwd: root },
    );
  console.log(`    applied to ${changed.join(', ')}`);
} else {
  console.log('    already applied');
}
