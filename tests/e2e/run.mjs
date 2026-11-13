import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { checkLifecycle } from './lifecycle.mjs';
import { request } from './request.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const OUTPUT = join(ROOT, 'tests/e2e/report');
mkdirSync(OUTPUT, { recursive: true });
const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit', ...options });
if (!process.env.E2E_SKIP_BUILD) {
  run('docker', ['build', '-t', 'tanuki-api:local', '-f', 'apps/api/Dockerfile', '.']);
  run('docker', [
    'build',
    '-t',
    'tanuki-api:e2e',
    '--target',
    'e2e',
    '-f',
    'apps/api/Dockerfile',
    '.',
  ]);
  run('docker', ['build', '-t', 'tanuki-web:local', '-f', 'apps/web/Dockerfile', '.']);
  if (!process.env.E2E_SMOKE_ONLY)
    run('docker', ['build', '-t', 'tanuki-e2e-runner:local', '-f', 'tests/e2e/Dockerfile', '.']);
}
for (const mode of process.env.E2E_PROJECT
  ? [process.env.E2E_PROJECT]
  : ['production', ...(process.env.E2E_SMOKE_ONLY ? [] : ['desktop', 'mobile'])]) {
  const stage = mkdtempSync(join(tmpdir(), 'tanuki-e2e-'));
  const project = `tanuki-e2e-${process.pid}-${mode}`;
  for (const [from, to] of [
    ['docker-compose.yml', 'docker-compose.yml'],
    ['tests/e2e/compose.yml', 'override.yml'],
    ['tests/e2e/fixture.mjs', 'fixture.mjs'],
    ['scripts/self-host/tanuki.sh', 'tanuki'],
  ])
    copyFileSync(join(ROOT, from), join(stage, to));
  const token = randomBytes(32).toString('hex');
  writeFileSync(
    join(stage, '.env'),
    [
      `COMPOSE_PROJECT_NAME=${project}`,
      'CONFIG_SCHEMA=1',
      'TANUKI_VERSION=baseline',
      'API_IMAGE=tanuki-api:local',
      'WEB_IMAGE=tanuki-web:local',
      'APP_URL=http://localhost:18080',
      'CADDY_SITE=:8080',
      'WEB_BIND=127.0.0.1',
      'HTTP_PORT=18080',
      'HTTPS_PORT=18443',
      'MAILPIT_PORT=18025',
      'COMPOSE_PROFILES=local',
      `POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}`,
      `IMG_SIGN_SECRET=${randomBytes(32).toString('hex')}`,
      `SOURCE_SECRETS_KEY=${randomBytes(32).toString('base64')}`,
      `METRICS_TOKEN=${token}`,
      'COOKIE_SECURE=false',
      'SOURCE_PROBE_ENABLED=false',
      'BOOKMARK_UPDATES_ENABLED=false',
      'TANUKI_SUBNET_PREFIX=172.30.99',
    ].join('\n') + '\n',
    { mode: 0o600 },
  );
  writeFileSync(join(stage, 'api.env'), 'SMTP_HOST=mailpit\nSMTP_PORT=1025\nSMTP_SECURE=false\n', {
    mode: 0o600,
  });
  mkdirSync(join(stage, 'data/libsocial-tokens'), { recursive: true, mode: 0o777 });
  const args = [
    'compose',
    '--project-directory',
    stage,
    '--env-file',
    join(stage, '.env'),
    '-f',
    join(stage, 'docker-compose.yml'),
  ];
  if (mode !== 'production') args.push('-f', join(stage, 'override.yml'));
  const compose = (...extra) => run('docker', [...args, ...extra]);
  try {
    compose('up', '-d', '--wait', '--wait-timeout', '180');
    if (mode === 'production') {
      let ready;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          ready = await request('http://localhost:18080/api/v1/health/ready');
          if (ready.ok) break;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!ready?.ok) throw new Error('Not ready');
      const auth = await request('http://localhost:18080/api/v1/auth/me');
      if (auth.status !== 401) throw new Error(`Unauthenticated API: ${auth.status}`);
    }
    // These operations exercise native modules on the actual image architecture.
    compose(
      'exec',
      '-T',
      'api',
      'node',
      '-e',
      "Promise.all([require('@node-rs/argon2').hash('fixture-password'),require('sharp')({create:{width:1,height:1,channels:3,background:'white'}}).png().toBuffer()]).then(()=>console.log('Native runtime OK'))",
    );
    const inviteOutput = run(
      'docker',
      [...args, 'exec', '-T', 'api', 'node', 'dist-cli/scripts/create-invite.js'],
      { encoding: 'utf8', stdio: 'pipe' },
    );
    const invite = inviteOutput.match(
      /http:\/\/localhost:(?:18080|8080)\/register\?invite=\S+/,
    )?.[0];
    if (!invite) throw new Error('Invite missing');
    if (mode !== 'production') {
      const webId = run('docker', [...args, 'ps', '-q', 'web'], {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const report = join(ROOT, 'apps/web/e2e');
      run('docker', [
        'run',
        '--rm',
        '--ipc=host',
        '--network',
        `container:${webId}`,
        '-e',
        `E2E_INVITE_URL=${invite}`,
        '-e',
        `E2E_METRICS_TOKEN=${token}`,
        '-e',
        'E2E_BASE_URL=http://localhost:8080',
        '-e',
        'E2E_MAILPIT_URL=http://mailpit:8025',
        '-e',
        'E2E_CONTROL_URL=http://api:9465',
        '-e',
        'E2E_METRICS_URL=http://api:9464',
        '-e',
        'E2E_FIXTURE_URL=http://fixture:4080',
        '-v',
        `${report}:/repo/apps/web/e2e`,
        'tanuki-e2e-runner:local',
        'pnpm',
        'exec',
        'playwright',
        'test',
        '-c',
        'e2e',
        '--project',
        mode,
      ]);
    } else {
      await checkLifecycle({ stage, args, invite });
    }
  } finally {
    const logs = run('docker', [...args, 'logs', '--no-color'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    writeFileSync(join(OUTPUT, `${mode}.log`), logs, { mode: 0o600 });
    // Only throwaway projects created here are removed, never a working installation.
    compose('down', '--volumes', '--remove-orphans');
  }
}
