import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SCRIPT = resolve(import.meta.dirname, 'tanuki.sh');
const setup = () => {
  const root = mkdtempSync(join(tmpdir(), 'tanuki-cli-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  copyFileSync(SCRIPT, join(root, 'tanuki'));
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_ROOT: root };
  const executable = (name, body) =>
    writeFileSync(join(bin, name), `#!/bin/bash\nset -eu\n${body}\n`, { mode: 0o700 });
  executable(
    'docker',
    `
case "$*" in
 info) exit 0;;
 'info --format {{.Architecture}}') echo aarch64; exit 0;;
 'version --format {{.Server.Version}}') echo 29.0.0; exit 0;;
 'compose version --short') echo 2.30.0; exit 0;;
 pull*) [[ \${TEST_REGISTRY_FAIL:-0} != 1 ]]; exit $?;;
 wait*) echo \${TEST_MIGRATION_CODE:-1}; exit 0;;
esac
printf '%s\\n' "$*" >> "$TEST_ROOT/docker.calls"
case "$*" in
 *pg_database_size*) echo 4096;;
 *pg_dump*) [[ \${TEST_DUMP_FAIL:-0} != 1 ]] || exit 1; echo 'fake SQL dump';;
 *preflight.js*) [[ \${TEST_SMTP_FAIL:-0} != 1 ]] || exit 1;;
 *'start api web') [[ \${TEST_RESTART_FAIL:-0} != 1 ]] || exit 1;;
 *'--entrypoint tar'*) tar -cf - -T /dev/null;;
 *'ps -aq migrate'*) echo fixture-migrator;;
esac`,
  );
  executable(
    'curl',
    `
output=
while (( $# )); do
 if [[ $1 == -o ]]; then output=$2; shift; fi
 shift
done
[[ -n $output || \${TEST_READY_FAIL:-0} != 1 ]] || exit 1
[[ -z $output ]] || cp "$TEST_ROOT/release/$(basename "$output")" "$output"`,
  );
  executable(
    'df',
    `if [[ \${TEST_NO_SPACE:-0} == 1 ]]; then printf 'Filesystem 1024-blocks Used Available Capacity Mounted\nfixture 1000 1000 0 100%% /\n'; else /bin/df "$@"; fi`,
  );
  executable('ss', '[[ \${TEST_PORT_BUSY:-0} != 1 ]] || echo LISTEN');
  executable('getent', 'echo 203.0.113.1');
  const run = (...args) =>
    spawnSync('bash', [join(root, 'tanuki'), ...args], {
      env,
      encoding: 'utf8',
      input: '',
      timeout: 10_000,
    });
  return { root, env, run };
};
const baseline = (root) => {
  writeFileSync(
    join(root, '.env'),
    'COMPOSE_PROJECT_NAME=fixture\nCONFIG_SCHEMA=1\nTANUKI_VERSION=v0.0.1\nAPI_IMAGE=old-api\nWEB_IMAGE=old-web\nAPP_URL=http://localhost:8080\nPOSTGRES_PASSWORD=' +
      'a'.repeat(64) +
      '\n',
  );
  writeFileSync(join(root, 'api.env'), 'SMTP_PASSWORD=keep-$`literal`-secret\n');
  writeFileSync(join(root, 'docker-compose.yml'), 'services: {}\n');
};
const release = (root) => {
  const dir = join(root, 'release');
  mkdirSync(dir);
  const files = {
    'docker-compose.yml': 'services: {}\n',
    'release.env': `CONFIG_SCHEMA=1\nTANUKI_VERSION=v0.0.2\nAPI_IMAGE=ghcr.io/fixture/api@sha256:${'a'.repeat(64)}\nWEB_IMAGE=ghcr.io/fixture/web@sha256:${'b'.repeat(64)}\n`,
    tanuki: readFileSync(SCRIPT, 'utf8'),
  };
  for (const [name, value] of Object.entries(files)) writeFileSync(join(dir, name), value);
  writeFileSync(
    join(dir, 'SHA256SUMS'),
    Object.entries(files)
      .map(([name, value]) => `${createHash('sha256').update(value).digest('hex')}  ${name}\n`)
      .join(''),
  );
};

test('repeated install and parallel operations preserve secrets', () => {
  const { root, run } = setup();
  baseline(root);
  const before = readFileSync(join(root, 'api.env'), 'utf8');
  assert.notEqual(run('install', '--local').status, 0);
  assert.equal(readFileSync(join(root, 'api.env'), 'utf8'), before);
  mkdirSync(join(root, '.admin-lock'));
  const locked = run('backup');
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /Другая административная операция/);
  assert.equal(existsSync(join(root, 'docker.calls')), false);
});

test('failed migration keeps backup, records stage and never starts old API', () => {
  const { root, run } = setup();
  baseline(root);
  release(root);
  const result = run('update', 'v0.0.2');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Старый API автоматически не запущен/);
  assert.match(result.stderr, /tanuki restore/);
  assert.match(readFileSync(join(root, 'operation.state'), 'utf8'), /stage=миграции/);
  assert.equal(
    readdirSync(join(root, 'backups')).filter((file) => file.endsWith('.tar')).length,
    1,
  );
  const archive = join(root, 'backups', readdirSync(join(root, 'backups'))[0]);
  const manifest = spawnSync('tar', ['-xOf', archive, 'SHA256SUMS'], { encoding: 'utf8' });
  assert.match(manifest.stdout, /[a-f0-9]{64}  config\/\.env\n/);
  assert.doesNotMatch(readFileSync(join(root, 'docker.calls'), 'utf8'), /start api web/);
  assert.equal(
    readFileSync(join(root, 'api.env'), 'utf8'),
    'SMTP_PASSWORD=keep-$`literal`-secret\n',
  );
  assert.doesNotMatch(result.stdout + result.stderr, /keep-.*secret/);
});

test('damaged archive is rejected before any current data is changed', () => {
  const { root, run } = setup();
  baseline(root);
  const path = join(root, 'broken.tar');
  writeFileSync(path, 'not a backup');
  assert.notEqual(run('restore', path).status, 0);
  assert.equal(existsSync(join(root, 'docker.calls')), false);
  assert.match(readFileSync(join(root, '.env'), 'utf8'), /TANUKI_VERSION=v0.0.1/);
});

test('unavailable registry and insufficient space fail before downtime or configuration switch', () => {
  for (const flag of ['TEST_REGISTRY_FAIL', 'TEST_NO_SPACE']) {
    const { root, env, run } = setup();
    baseline(root);
    release(root);
    env[flag] = '1';
    const before = readFileSync(join(root, '.env'), 'utf8');
    const result = run('update', 'v0.0.2');
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(join(root, '.env'), 'utf8'), before);
    assert.equal(existsSync(join(root, 'docker.calls')), false);
    assert.equal(existsSync(join(root, 'operation.state')), false);
  }
});

test('recover completes an interrupted installation without changing secrets or configuration', () => {
  for (const failure of ['TEST_SMTP_FAIL', 'TEST_MIGRATION_CODE']) {
    const { root, env, run } = setup();
    release(root);
    env.TANUKI_RELEASE = 'v0.0.2';
    env.TEST_MIGRATION_CODE = '0';
    env[failure] = '1';
    const failed = run('install', '--local');
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /tanuki recover/);
    assert.match(readFileSync(join(root, 'operation.state'), 'utf8'), /operation=install/);
    const configuration = readFileSync(join(root, '.env'), 'utf8');
    const secrets = readFileSync(join(root, 'api.env'), 'utf8');
    assert.notEqual(run('admin-invite').status, 0);
    env[failure] = '0';
    const recovered = run('recover');
    assert.equal(recovered.status, 0, recovered.stderr);
    assert.equal(existsSync(join(root, 'operation.state')), false);
    assert.equal(readFileSync(join(root, '.env'), 'utf8'), configuration);
    assert.equal(readFileSync(join(root, 'api.env'), 'utf8'), secrets);
    assert.equal(run('admin-invite').status, 0);
    assert.doesNotMatch(
      readFileSync(join(root, 'docker.calls'), 'utf8'),
      /DROP DATABASE|down|pg_restore -U/,
    );
  }
});

test('failed backup unblocks commands only after the unchanged application is ready', () => {
  for (const operation of ['backup', 'update']) {
    const { root, env, run } = setup();
    baseline(root);
    release(root);
    env.TEST_DUMP_FAIL = '1';
    const configuration = readFileSync(join(root, '.env'), 'utf8');
    const failed = run(operation, 'v0.0.2');
    assert.notEqual(failed.status, 0);
    assert.match(readFileSync(join(root, 'docker.calls'), 'utf8'), /start api web/);
    assert.equal(existsSync(join(root, 'operation.state')), false);
    assert.equal(readFileSync(join(root, '.env'), 'utf8'), configuration);
    assert.equal(run('admin-invite').status, 0);
  }
});

test('recover preserves the journal until readiness succeeds and refuses migrated updates', () => {
  const { root, env, run } = setup();
  baseline(root);
  env.TEST_DUMP_FAIL = '1';
  env.TEST_RESTART_FAIL = '1';
  assert.notEqual(run('backup').status, 0);
  assert.equal(existsSync(join(root, 'operation.state')), true);
  env.TEST_RESTART_FAIL = '0';
  env.TEST_READY_FAIL = '1';
  assert.notEqual(run('recover').status, 0);
  assert.equal(existsSync(join(root, 'operation.state')), true);
  env.TEST_READY_FAIL = '0';
  assert.equal(run('recover').status, 0);
  assert.equal(existsSync(join(root, 'operation.state')), false);
  writeFileSync(join(root, 'operation.state'), 'operation=update\nmigration_started=1\n');
  const calls = readFileSync(join(root, 'docker.calls'), 'utf8');
  const migrated = run('recover');
  assert.notEqual(migrated.status, 0);
  assert.match(migrated.stderr, /Используйте restore/);
  assert.equal(readFileSync(join(root, 'docker.calls'), 'utf8'), calls);
  assert.equal(existsSync(join(root, 'operation.state')), true);
});

test('failed port checks discard only the new configuration and allow another installation', () => {
  const { root, env, run } = setup();
  release(root);
  env.TANUKI_RELEASE = 'v0.0.2';
  env.TEST_MIGRATION_CODE = '0';
  env.TEST_PORT_BUSY = '1';
  const failed = run('install', '--local');
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /Порт 8080 занят/);
  for (const file of ['.env', 'api.env', 'docker-compose.yml', 'operation.state']) {
    assert.equal(existsSync(join(root, file)), false, file);
  }
  env.TEST_PORT_BUSY = '0';
  const retried = run('install', '--local');
  assert.equal(retried.status, 0, retried.stderr);
  assert.equal(existsSync(join(root, 'operation.state')), false);
  assert.equal(run('admin-invite').status, 0);
});
