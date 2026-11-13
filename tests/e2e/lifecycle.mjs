import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { request } from './request.mjs';

export const checkLifecycle = async ({ stage, args, invite }) => {
  const run = (...extra) => execFileSync('docker', [...args, ...extra], { stdio: 'inherit' });
  const api = (path, options = {}) => request(`http://localhost:18080/api/v1${path}`, options);
  const json = (data) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const registration = await api(
    '/auth/register',
    json({
      inviteCode: new URL(invite).searchParams.get('invite'),
      email: 'baseline@example.org',
      username: 'baseline_admin',
      password: 'Baseline-password-123',
      language: 'ru',
    }),
  );
  assert.equal(registration.status, 204);
  const mail = await (await request('http://localhost:18025/api/v1/messages')).json();
  const message = await (
    await request(`http://localhost:18025/api/v1/message/${mail.messages[0].ID}`)
  ).json();
  const token = String(message.Text).match(/verify-email\?token=([a-zA-Z0-9_-]+)/)?.[1];
  assert.ok(token);
  const verified = await api('/auth/verify-email', json({ token }));
  assert.ok(verified.ok);
  const user = await verified.json();
  const cookie = verified.headers.get('set-cookie').split(';')[0];
  const settings = (colorScheme) =>
    api('/user-settings', {
      method: 'PUT',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ colorScheme }),
    });
  assert.ok((await settings('dark')).ok);
  const duplicate = spawnSync(
    'docker',
    [...args, 'exec', '-T', 'api', 'node', 'dist-cli/scripts/create-invite.js'],
    { encoding: 'utf8' },
  );
  assert.notEqual(duplicate.status, 0, 'Existing admin must reject bootstrap');
  const original = readFileSync(join(stage, '.env'), 'utf8');
  const backupOutput = execFileSync('bash', [join(stage, 'tanuki'), 'backup'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const backup = backupOutput.match(/Резервная копия: (.+)/)?.[1];
  assert.ok(backup);
  // A reproducible first-release baseline: same source image, a distinct release configuration.
  run('stop', 'web', 'api');
  writeFileSync(
    join(stage, '.env'),
    original.replace('TANUKI_VERSION=baseline', 'TANUKI_VERSION=test-update'),
  );
  run('rm', '-sf', 'migrate');
  run('up', '-d', '--wait', '--wait-timeout', '180');
  assert.equal((await (await api('/auth/me', { headers: { cookie } })).json()).id, user.id);
  assert.equal(
    (await (await api('/user-settings', { headers: { cookie } })).json()).colorScheme,
    'dark',
  );
  assert.ok((await settings('light')).ok);
  // Failed target migration must prevent new API startup. Restore returns data and version together.
  writeFileSync(
    join(stage, 'failure.yml'),
    "services:\n  migrate:\n    command: ['node', '-e', 'process.exit(42)']\n",
  );
  run('stop', 'web', 'api');
  run('rm', '-sf', 'migrate');
  const failed = spawnSync(
    'docker',
    [
      ...args,
      '-f',
      join(stage, 'failure.yml'),
      'up',
      '-d',
      '--wait',
      '--wait-timeout',
      '30',
      'api',
      'web',
    ],
    { encoding: 'utf8' },
  );
  assert.notEqual(failed.status, 0);
  const running = execFileSync('docker', [...args, 'ps', '--status', 'running', '--services'], {
    encoding: 'utf8',
  });
  assert.ok(!running.split('\n').includes('api'), 'Old API must remain stopped');
  execFileSync('bash', [join(stage, 'tanuki'), 'restore', backup], {
    input: 'ВОССТАНОВИТЬ\n',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  assert.equal(readFileSync(join(stage, '.env'), 'utf8'), original);
  assert.equal((await (await api('/auth/me', { headers: { cookie } })).json()).id, user.id);
  assert.equal(
    (await (await api('/user-settings', { headers: { cookie } })).json()).colorScheme,
    'dark',
  );
  assert.equal((await api('/health/ready')).status, 200);
  console.log('Lifecycle OK: user data → backup → update → migration failure → explicit restore');
};
