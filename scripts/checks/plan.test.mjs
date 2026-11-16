import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { planChanges } from './git.mjs';
import { createPlan, ROOT } from './plan.mjs';
import { needsTask, taskCommands } from './run.mjs';

const testNames = (plan) => plan.tests.map(({ name }) => name).sort();
const allSkipped = (plan) => {
  for (const task of ['typecheck', 'build', 'test', 'visual', 'e2e', 'local', 'all'])
    assert.equal(needsTask(plan, task), false, task);
};

test('documentation needs no application checks', () => {
  allSkipped(createPlan(['README.md', 'docs/07-tooling.md', 'AGENTS.md']));
  allSkipped(createPlan([]));
});

test('story-only changes keep typecheck and visual, without application builds or e2e', () => {
  const plan = createPlan(['apps/web/src/shared/ui/CompactMultiSelect.stories.tsx']);
  assert.deepEqual(plan.typecheck, ['@tanuki/web']);
  assert.deepEqual(plan.build, []);
  assert.deepEqual(plan.tests, []);
  assert.equal(plan.visual, true);
  assert.equal(plan.e2e, false);
});

test('playground changes only typecheck web', () => {
  const plan = createPlan(['apps/web/src/pages/Playground/Example/index.tsx']);
  assert.deepEqual(plan.typecheck, ['@tanuki/web']);
  assert.deepEqual(plan.build, []);
  assert.equal(needsTask(plan, 'test'), false);
  assert.equal(plan.visual, false);
  assert.equal(plan.e2e, false);
});

test('web component changes do not run API or parsers tests', () => {
  const plan = createPlan(['apps/web/src/shared/ui/CompactMultiSelect.tsx']);
  assert.deepEqual(testNames(plan), ['@tanuki/web']);
  assert.deepEqual(plan.build, ['@tanuki/web']);
  assert.equal(plan.visual, true);
  assert.equal(plan.e2e, true);
});

test('API modules select related tests, without web checks', () => {
  const plan = createPlan(['apps/api/src/search/search.service.ts']);
  assert.deepEqual(testNames(plan), ['@tanuki/api']);
  assert.deepEqual(plan.tests[0].related, ['src/search/search.service.ts']);
  assert.equal(plan.visual, false);
  assert.equal(plan.e2e, true);
});

test('production CLI scripts and compiler settings require a build and e2e', () => {
  for (const file of ['apps/api/scripts/preflight.ts', 'apps/api/tsconfig.cli.json']) {
    const plan = createPlan([file]);
    assert.deepEqual(plan.build, ['@tanuki/api']);
    assert.equal(plan.e2e, true);
    assert.equal(plan.tests[0].related, null);
  }
});

test('parser changes include API consumers, but only related parser unit tests', () => {
  const plan = createPlan(['packages/parsers/src/sources/acomics/index.ts']);
  assert.deepEqual(testNames(plan), ['@tanuki/api', '@tanuki/parsers']);
  assert.equal(plan.tests.find(({ name }) => name === '@tanuki/api').related, null);
  assert.deepEqual(plan.tests.find(({ name }) => name === '@tanuki/parsers').related, [
    'src/sources/acomics/index.ts',
  ]);
  assert.equal(plan.visual, false);
  const commands = taskCommands(plan, 'test');
  const related = commands.find(([, args]) => args.includes('related'))[1];
  assert.ok(related.includes('--project'));
  assert.ok(related.includes('unit'));
  assert.equal(related.includes('contract'), false);
  assert.equal(
    commands.some(([, args]) => args.includes('run') && args.includes('test')),
    false,
  );
});

test('contracts changes run full unit suites of every consumer', () => {
  const plan = createPlan(['packages/contracts/src/index.ts']);
  assert.deepEqual(testNames(plan), ['@tanuki/api', '@tanuki/parsers', '@tanuki/web']);
  assert.ok(plan.tests.every(({ related }) => related === null));
  assert.equal(plan.visual, true);
  assert.equal(plan.e2e, true);
});

test('mixed story and upstream changes still build and test every consumer', () => {
  const plan = createPlan([
    'packages/contracts/src/index.ts',
    'apps/web/src/shared/ui/CompactMultiSelect.stories.tsx',
    'apps/api/src/search/search.service.test.ts',
  ]);
  assert.deepEqual(testNames(plan), ['@tanuki/api', '@tanuki/parsers', '@tanuki/web']);
  assert.ok(plan.tests.every(({ related }) => related === null));
  for (const name of ['@tanuki/api', '@tanuki/parsers', '@tanuki/web'])
    assert.ok(plan.build.includes(name), name);
});

test('config packages propagate through workspace devDependencies', () => {
  const plan = createPlan(['packages/tsconfig/base.json']);
  assert.ok(plan.typecheck.includes('@tanuki/api'));
  assert.ok(plan.typecheck.includes('@tanuki/web'));
  assert.ok(plan.typecheck.includes('@tanuki/parsers'));
  assert.ok(plan.tests.every(({ related }) => related === null));
});

test('migrations and fixtures read from disk force full API tests', () => {
  for (const file of [
    'apps/api/drizzle/0034_reader_improvements.sql',
    'apps/api/src/reading-progress/fixtures/one-piece/acomics.json',
  ]) {
    const plan = createPlan([file]);
    assert.deepEqual(testNames(plan), ['@tanuki/api']);
    assert.equal(plan.tests[0].related, null);
  }
});

test('self-host and e2e harness changes run integration checks without unrelated units', () => {
  const selfHost = createPlan(['scripts/self-host/tanuki.sh']);
  assert.equal(selfHost.selfHost, true);
  assert.equal(selfHost.e2e, true);
  assert.deepEqual(selfHost.tests, []);
  const harness = createPlan(['tests/e2e/compose.yml']);
  assert.equal(harness.e2e, true);
  assert.deepEqual(harness.tests, []);
});

test('unknown inputs, root configs and lockfiles select all checks', () => {
  for (const file of [
    'pnpm-lock.yaml',
    'turbo.json',
    '.github/workflows/ci.yml',
    'new-package/code.ts',
  ]) {
    const plan = createPlan([file]);
    assert.equal(plan.full, true, file);
    assert.equal(plan.e2e, true);
    assert.equal(plan.visual, true);
    assert.equal(plan.selfHost, true);
    assert.equal(plan.tooling, true);
  }
});

test('explicit release mode ignores empty and documentation-only diffs', () => {
  for (const files of [[], ['README.md']]) {
    const plan = createPlan(files, { full: true });
    assert.deepEqual(testNames(plan), ['@tanuki/api', '@tanuki/parsers', '@tanuki/web']);
    assert.ok(plan.tests.every(({ related }) => related === null));
    for (const task of ['typecheck', 'build', 'test', 'visual', 'e2e'])
      assert.equal(needsTask(plan, task), true, task);
    assert.equal(plan.selfHost, true);
    assert.equal(plan.tooling, true);
    const commands = taskCommands(plan, 'all');
    for (const script of ['test:self-host', 'test:checks', 'test:e2e', 'test:visual'])
      assert.ok(
        commands.some(([, args]) => args.includes(script)),
        script,
      );
    assert.ok(taskCommands(plan, 'typecheck')[0][1].includes('--force'));
    assert.equal(
      commands.some(([, args]) => args.includes('related')),
      false,
    );
  }
});

test('missing comparison base selects all checks', () => {
  for (const base of [undefined, '', '0000000000000000000000000000000000000000'])
    assert.equal(planChanges({ base }).full, true);
});

const gitFixture = (context) => {
  const root = mkdtempSync(resolve(tmpdir(), 'tanuki-checks-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const write = (file, content = 'export const VALUE = 1;\n') => {
    mkdirSync(resolve(root, file, '..'), { recursive: true });
    writeFileSync(resolve(root, file), content);
  };
  git('init', '-q');
  git('config', 'user.name', 'Checks test');
  git('config', 'user.email', 'checks@example.invalid');
  write('README.md', 'Initial\n');
  git('add', '.');
  git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'initial');
  return { root, git, write };
};

test('staged mode ignores unstaged paths', (context) => {
  const { root, git, write } = gitFixture(context);
  write('apps/api/src/search/service.ts');
  git('add', 'apps/api');
  write('apps/web/src/Example.tsx');
  const plan = planChanges({ staged: true, root });
  assert.deepEqual(plan.files, ['apps/api/src/search/service.ts']);
  assert.deepEqual(testNames(plan), ['@tanuki/api']);
});

test('cross-package moves include deleted dependencies and force the old suite', (context) => {
  const { root, git, write } = gitFixture(context);
  write('apps/api/src/old.ts');
  git('add', '.');
  git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'add old module');
  write('packages/parsers/src/new.ts');
  git('rm', '-q', 'apps/api/src/old.ts');
  git('add', '.');
  const plan = planChanges({ staged: true, root });
  assert.ok(plan.files.includes('apps/api/src/old.ts'));
  assert.ok(plan.files.includes('packages/parsers/src/new.ts'));
  assert.equal(plan.tests.find(({ name }) => name === '@tanuki/api').related, null);
});

test('PR selection includes earlier commits in the branch', (context) => {
  const { root, git, write } = gitFixture(context);
  const base = git('rev-parse', 'HEAD');
  write('apps/api/src/search/service.ts');
  git('add', '.');
  git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'change API');
  write('README.md', 'Documentation after code change\n');
  git('add', '.');
  git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'change docs');
  const plan = planChanges({ base, root });
  assert.deepEqual(testNames(plan), ['@tanuki/api']);
  assert.equal(plan.e2e, true);
});

test('an invalid comparison reference falls back to full checks', (context) => {
  const { root } = gitFixture(context);
  assert.equal(planChanges({ base: 'missing-reference', root }).full, true);
});

test('required jobs fail when planning failed or produced an invalid plan', () => {
  for (const [result, plan] of [
    ['failure', '{}'],
    ['cancelled', '{}'],
    ['success', ''],
    ['success', '{}'],
  ]) {
    const child = spawnSync(
      process.execPath,
      ['scripts/checks/run.mjs', '--task', 'e2e', '--status'],
      {
        cwd: ROOT,
        env: { ...process.env, CHECKS_PLAN_RESULT: result, CHECKS_PLAN: plan },
        encoding: 'utf8',
      },
    );
    assert.notEqual(child.status, 0);
  }
});

test('full mode refuses a partial CI plan', () => {
  const child = spawnSync(
    process.execPath,
    ['scripts/checks/run.mjs', '--full', '--task', 'e2e', '--status'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        CHECKS_PLAN_RESULT: 'success',
        CHECKS_PLAN: JSON.stringify(createPlan(['README.md'])),
      },
      encoding: 'utf8',
    },
  );
  assert.notEqual(child.status, 0);
});

for (const partial of [false, true]) {
  test(`pre-commit checks the index snapshot and restores worktree (partial=${partial})`, (context) => {
    const { root, git, write } = gitFixture(context);
    write('.lintstagedrc.mjs', readFileSync(resolve(ROOT, '.lintstagedrc.mjs'), 'utf8'));
    write('apps/api/src/remove.ts');
    write('snapshot.txt', 'base');
    write('unrelated.txt', 'base');
    write(
      'scripts/checks/run.mjs',
      `import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
assert.equal(existsSync('untracked.txt'), false);
assert.equal(readFileSync('unrelated.txt', 'utf8'), 'base');
assert.equal(readFileSync('snapshot.txt', 'utf8'), ${JSON.stringify(partial ? 'staged' : 'base')});
assert.equal(existsSync('apps/api/src/remove.ts'), false);
writeFileSync('checked.txt', 'ran');\n`,
    );
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'add hook fixture');
    git('rm', '-q', 'apps/api/src/remove.ts');
    if (partial) {
      write('snapshot.txt', 'staged');
      git('add', 'snapshot.txt');
      write('snapshot.txt', 'unstaged');
    }
    write('unrelated.txt', 'unstaged');
    write('untracked.txt', 'keep');
    const flags = readFileSync(resolve(ROOT, '.husky/pre-commit'), 'utf8')
      .trim()
      .split(' ')
      .slice(2);
    const child = spawnSync(
      process.execPath,
      [resolve(ROOT, 'node_modules/lint-staged/bin/lint-staged.js'), ...flags],
      { cwd: root, encoding: 'utf8', timeout: 30_000 },
    );
    assert.equal(child.status, 0, child.stdout + child.stderr);
    assert.equal(readFileSync(resolve(root, 'checked.txt'), 'utf8'), 'ran');
    assert.equal(readFileSync(resolve(root, 'untracked.txt'), 'utf8'), 'keep');
    assert.equal(readFileSync(resolve(root, 'unrelated.txt'), 'utf8'), 'unstaged');
    assert.equal(
      readFileSync(resolve(root, 'snapshot.txt'), 'utf8'),
      partial ? 'unstaged' : 'base',
    );
    assert.equal(
      git('diff', '--cached', '--name-only', '--diff-filter=D'),
      'apps/api/src/remove.ts',
    );
  });
}

test('an unaffected required check reports success without running tests', () => {
  const child = spawnSync(
    process.execPath,
    ['scripts/checks/run.mjs', '--task', 'e2e', '--status'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        CHECKS_PLAN_RESULT: 'success',
        CHECKS_PLAN: JSON.stringify(createPlan(['README.md'])),
      },
      encoding: 'utf8',
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /e2e: not affected/);
});

test('CI preserves required job identities and guards planning failures', () => {
  const workflow = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
  for (const name of ['typecheck', 'build', 'test', 'visual', 'e2e']) {
    const job = workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [a-z]+:\n/)[0];
    assert.ok(job, name);
    assert.match(job, /needs: changes/);
    assert.match(job, /if: \$\{\{ always\(\) \}\}/);
    assert.match(job, /CHECKS_PLAN_RESULT: \$\{\{ needs.changes.result \}\}/);
    assert.ok(job.includes(`--task ${name} --status`));
  }
  assert.match(workflow, /startsWith\(github.ref, 'refs\/tags\/'\)/);
  const release = readFileSync(resolve(ROOT, '.github/workflows/release.yml'), 'utf8');
  assert.match(release, /uses: \.\/\.github\/workflows\/ci.yml\n    with:\n      full: true/);
});
