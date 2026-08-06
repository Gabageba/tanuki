import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(packageRoot, 'dist');

const compile = (project) =>
  execFileSync('tsc', ['-p', project], { cwd: packageRoot, stdio: 'inherit' });

/** Формат каждой сборки фиксируется своим package.json, иначе Node читает корневой "type". */
const markFormat = (folder, type) => {
  const target = join(dist, folder);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`);
};

rmSync(dist, { recursive: true, force: true });
compile('tsconfig.cjs.json');
compile('tsconfig.esm.json');
markFormat('cjs', 'commonjs');
markFormat('esm', 'module');
