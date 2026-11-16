import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { planChanges } from './git.mjs';
import { ROOT } from './plan.mjs';

export const needsTask = (plan, task) => {
  switch (task) {
    case 'typecheck':
    case 'build':
      return plan[task].length > 0;
    case 'test':
      return plan.tests.length > 0 || plan.selfHost || plan.tooling;
    case 'visual':
    case 'e2e':
      return plan[task];
    case 'local':
      return needsTask(plan, 'typecheck') || needsTask(plan, 'test');
    case 'all':
      return ['typecheck', 'build', 'test', 'visual', 'e2e'].some((item) => needsTask(plan, item));
    default:
      throw new Error(`Unknown check: ${task}`);
  }
};

export const taskCommands = (plan, task) => {
  const turbo = (operation, packages) =>
    packages.length
      ? [
          [
            'pnpm',
            [
              'turbo',
              'run',
              operation,
              ...packages.map((name) => `--filter=${name}`),
              ...(plan.full ? ['--force'] : []),
            ],
          ],
        ]
      : [];
  switch (task) {
    case 'typecheck':
    case 'build':
      return turbo(task, plan[task]);
    case 'test': {
      // Related subsets run outside Turbo: caching one as the package's full test
      // result would incorrectly satisfy a later full run.
      const commands = [];
      const names = plan.tests.map(({ name }) => name);
      if (names.length) {
        commands.push([
          'pnpm',
          ['turbo', 'run', 'build', ...names.map((name) => `--filter=${name}^...`)],
        ]);
      }
      for (const workspace of plan.tests) {
        if (workspace.related) {
          commands.push([
            'pnpm',
            [
              '--filter',
              workspace.name,
              'exec',
              'vitest',
              'related',
              '--run',
              '--passWithNoTests',
              ...(workspace.name === '@tanuki/parsers' ? ['--project', 'unit'] : []),
              ...workspace.related,
            ],
          ]);
        } else commands.push(['pnpm', ['--filter', workspace.name, 'test']]);
      }
      if (plan.selfHost) commands.push(['pnpm', ['test:self-host']]);
      if (plan.tooling) commands.push(['pnpm', ['test:checks']]);
      return commands;
    }
    case 'visual':
      return plan.visual ? [['pnpm', ['test:visual']]] : [];
    case 'e2e':
      return plan.e2e ? [['pnpm', ['test:e2e']]] : [];
    case 'local':
      return [...taskCommands(plan, 'typecheck'), ...taskCommands(plan, 'test')];
    case 'all':
      return ['typecheck', 'build', 'test', 'visual', 'e2e'].flatMap((item) =>
        taskCommands(plan, item),
      );
    default:
      throw new Error(`Unknown check: ${task}`);
  }
};

export const main = () => {
  const { values } = parseArgs({
    options: {
      full: { type: 'boolean', default: process.env.CHECKS_FULL === 'true' },
      staged: { type: 'boolean', default: false },
      base: { type: 'string', default: process.env.CHECKS_BASE },
      head: { type: 'string', default: process.env.CHECKS_HEAD ?? 'HEAD' },
      task: { type: 'string', default: 'local' },
      plan: { type: 'boolean', default: false },
      status: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (process.env.CHECKS_PLAN_RESULT && process.env.CHECKS_PLAN_RESULT !== 'success')
    throw new Error('Change detection failed; required checks cannot pass.');
  if (process.env.CHECKS_PLAN_RESULT && !process.env.CHECKS_PLAN)
    throw new Error('Change detection produced no plan.');
  const plan = process.env.CHECKS_PLAN ? JSON.parse(process.env.CHECKS_PLAN) : planChanges(values);
  for (const field of ['full', 'visual', 'e2e', 'selfHost', 'tooling']) {
    if (typeof plan[field] !== 'boolean') throw new Error(`Invalid plan field: ${field}`);
  }
  for (const field of ['typecheck', 'build', 'tests']) {
    if (!Array.isArray(plan[field])) throw new Error(`Invalid plan field: ${field}`);
  }
  if (values.full && !plan.full) throw new Error('A full run cannot use a partial plan.');
  if (values.plan) {
    console.log(JSON.stringify(plan, null, 2));
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `plan=${JSON.stringify(plan)}\n`);
    return;
  }
  const needed = needsTask(plan, values.task);
  console.log(`${values.task}: ${needed ? 'run' : 'not affected'} (${plan.reason})`);
  if (values.status) {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${needed}\n`);
    return;
  }
  for (const [command, args] of taskCommands(plan, values.task)) {
    console.log([command, ...args].join(' '));
    if (!values['dry-run']) execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
