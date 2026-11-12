import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import http from 'node:http';

const ROOT = resolve(import.meta.dirname, '../..');
const OUTPUT = join(import.meta.dirname, 'report');
const STAGE = mkdtempSync(join(tmpdir(), 'tanuki-load-'));
const PROJECT = `tanuki-load-${process.pid}`;
const API_IMAGE = process.env.LOAD_API_IMAGE ?? 'tanuki-api:local';
const WEB_IMAGE = process.env.LOAD_WEB_IMAGE ?? 'tanuki-web:local';
const SECONDS = Number(process.env.LOAD_SECONDS ?? 12);
const PROFILES = (process.env.LOAD_PROFILES ?? '1,2').split(',').map(Number);
const SCENARIOS = process.env.LOAD_SCENARIOS
  ? JSON.parse(process.env.LOAD_SCENARIOS)
  : [
      ['mixed', [1, 10, 50, 100, 200]],
      ['pages', [1, 10, 25, 50, 100, 200]],
      ['covers', [1, 5, 10, 25, 50, 100]],
      ['login', [4, 16, 64]],
    ];
const SECRET = 'temporary-load-test-secret';
mkdirSync(OUTPUT, { recursive: true });
const run = (args, options = {}) =>
  execFileSync('docker', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  })?.trim() ?? '';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const asyncRun = (args) =>
  new Promise((done, reject) => {
    const child = spawn('docker', args, { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? done(stdout.trim()) : reject(new Error(`${code}: ${stderr}\n${stdout}`)),
    );
  });
const SOCKET_URL = run(['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']);
if (!SOCKET_URL.startsWith('unix://'))
  throw new Error('This runner requires a local Unix Docker socket');
const engine = (path) =>
  new Promise((done, reject) => {
    const request = http.get({ socketPath: SOCKET_URL.slice(7), path }, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          done(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(2000, () => request.destroy(new Error('Docker stats timeout')));
    request.on('error', reject);
  });
const imageId = (image) => {
  try {
    return run(['image', 'inspect', image, '--format', '{{.Id}}']);
  } catch {
    const id = run(['image', 'ls', '--filter', `reference=${image}`, '--format', '{{.ID}}']).split(
      '\n',
    )[0];
    if (!id) throw new Error(`Local image is missing: ${image}`);
    return run(['image', 'inspect', id, '--format', '{{.Id}}']);
  }
};
const IMAGES = {
  api: imageId(API_IMAGE),
  web: imageId(WEB_IMAGE),
  postgres: imageId('postgres:17.6-alpine'),
  valkey: imageId('valkey/valkey:8.1.3-alpine'),
};
const COMMON = {
  image: IMAGES.api,
  pull_policy: 'never',
  volumes: [`${ROOT}/apps/api/dist:/app/dist:ro`, `${import.meta.dirname}:/load:ro`],
  environment: {
    NODE_ENV: 'production',
    IMG_SIGN_SECRET: SECRET,
    DATABASE_URL: 'postgres://tanuki:load-only@postgres:5432/tanuki',
    REDIS_URL: 'redis://valkey:6379',
    CACHE_REDIS_URL: 'redis://cache:6379',
    APP_URL: 'http://localhost',
    SOURCE_PROBE_ENABLED: 'false',
    BOOKMARK_UPDATES_ENABLED: 'false',
  },
};
const COMPOSE_ARGS = ['compose', '-p', PROJECT, '-f', join(STAGE, 'compose.json')];
const compose = (...args) => run([...COMPOSE_ARGS, ...args]);
const mib = (bytes) => +(bytes / 1024 / 1024).toFixed(1);
const REPORT = {
  project: PROJECT,
  createdAt: new Date().toISOString(),
  images: IMAGES,
  limits: 'API, Postgres, Valkey and Caddy share CPU 0; no swap',
  fixture:
    '1600x2400 noise JPEG, quality 85; 50ms image delay; real AComics HTML parser; no external network',
  users: 200,
  secondsPerStage: SECONDS,
  scenarios: SCENARIOS,
  profiles: [],
};
const save = () => writeFileSync(join(OUTPUT, 'results.json'), JSON.stringify(REPORT, null, 2));
const waitReady = async () => {
  for (let i = 0; i < 30; i += 1) {
    try {
      run([
        'exec',
        `${PROJECT}-fixture-1`,
        'node',
        '-e',
        'fetch("http://web:8080/api/v1/health/ready").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))',
      ]);
      return;
    } catch {
      await sleep(500);
    }
  }
  throw new Error('API did not become ready');
};
const measure = async (work) => {
  const names = ['api', 'postgres', 'valkey', 'cache', 'web'];
  const samples = [];
  let measuring = true;
  const monitoring = (async () => {
    while (measuring) {
      const readings = await Promise.all(
        names.map(async (name) => {
          try {
            const stats = await engine(
              `/containers/${PROJECT}-${name}-1/stats?stream=false&one-shot=true`,
            );
            const memory = stats.memory_stats ?? {};
            return {
              name,
              bytes: Math.max(0, (memory.usage ?? 0) - (memory.stats?.inactive_file ?? 0)),
              cpuNs: stats.cpu_stats?.cpu_usage?.total_usage ?? 0,
            };
          } catch {
            return { name, bytes: 0, cpuNs: 0 };
          }
        }),
      );
      samples.push({
        time: Date.now(),
        readings,
        total: readings.reduce((sum, r) => sum + r.bytes, 0),
      });
      await sleep(500);
    }
  })();
  let result;
  try {
    result = await work();
  } finally {
    measuring = false;
    await monitoring;
  }
  const first = samples[0];
  const last = samples.at(-1);
  const elapsedMs = last && first ? last.time - first.time : 0;
  const cpuDelta =
    (last?.readings.reduce((sum, r) => sum + r.cpuNs, 0) ?? 0) -
    (first?.readings.reduce((sum, r) => sum + r.cpuNs, 0) ?? 0);
  return {
    ...result,
    peakStackMiB: mib(Math.max(0, ...samples.map((s) => s.total))),
    peakByServiceMiB: Object.fromEntries(
      names.map((name) => [
        name,
        mib(
          Math.max(
            0,
            ...samples.flatMap((s) =>
              s.readings.filter((r) => r.name === name).map((r) => r.bytes),
            ),
          ),
        ),
      ]),
    ),
    averageCpuPercentOfOneCore:
      elapsedMs > 0 && cpuDelta >= 0 ? +(cpuDelta / elapsedMs / 10000).toFixed(1) : null,
    samples: samples.length,
  };
};

const cleanup = () => {
  save();
  try {
    run(['rm', '-f', `${PROJECT}-client`]);
  } catch {}
  try {
    writeFileSync(
      join(OUTPUT, 'last-containers.log'),
      compose('logs', '--no-color', '--tail', '100'),
    );
  } catch {}
  try {
    compose('down', '--volumes', '--remove-orphans');
  } catch {}
};
process.once('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.once('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

try {
  run(['info', '--format', '{{.Architecture}} / {{.NCPU}} CPUs / {{.MemTotal}} bytes'], {
    stdio: 'inherit',
  });
  for (const ram of PROFILES) {
    // Leave 256/384 MiB for the VPS OS. Source fixture and generator are outside this budget.
    const limits =
      ram === 1
        ? { api: 416, postgres: 160, valkey: 32, cache: 64, web: 96 }
        : { api: 1216, postgres: 192, valkey: 64, cache: 64, web: 128 };
    const cap = (name) => ({
      mem_limit: `${limits[name]}m`,
      memswap_limit: `${limits[name]}m`,
      cpuset: '0',
    });
    const config = {
      services: {
        postgres: {
          image: IMAGES.postgres,
          pull_policy: 'never',
          ...cap('postgres'),
          environment: {
            POSTGRES_USER: 'tanuki',
            POSTGRES_PASSWORD: 'load-only',
            POSTGRES_DB: 'tanuki',
          },
          volumes: ['/var/lib/postgresql/data'],
          healthcheck: {
            test: ['CMD', 'pg_isready', '-h', '127.0.0.1', '-U', 'tanuki'],
            interval: '1s',
            timeout: '2s',
            retries: 40,
          },
        },
        valkey: {
          image: IMAGES.valkey,
          pull_policy: 'never',
          ...cap('valkey'),
          command: ['valkey-server', '--save', ''],
        },
        cache: {
          image: IMAGES.valkey,
          pull_policy: 'never',
          ...cap('cache'),
          command: [
            'valkey-server',
            '--maxmemory',
            '32mb',
            '--maxmemory-policy',
            'allkeys-lru',
            '--save',
            '',
            '--appendonly',
            'no',
          ],
        },
        fixture: {
          ...COMMON,
          command: ['node', '/load/fixture.cjs'],
          mem_limit: '192m',
          memswap_limit: '192m',
          cpus: 1,
          cpuset: '1',
        },
        migrate: {
          ...COMMON,
          command: ['node', 'dist-cli/scripts/migrate.js'],
          depends_on: { postgres: { condition: 'service_healthy' } },
        },
        api: {
          ...COMMON,
          ...cap('api'),
          command: ['node', '-r', '/load/preload.cjs', 'dist/main.js'],
          logging: { driver: 'json-file', options: { 'max-size': '10m', 'max-file': '1' } },
          depends_on: {
            migrate: { condition: 'service_completed_successfully' },
            fixture: { condition: 'service_started' },
            valkey: { condition: 'service_started' },
            cache: { condition: 'service_started' },
          },
        },
        web: {
          image: IMAGES.web,
          pull_policy: 'never',
          ...cap('web'),
          environment: {
            CADDY_SITE: 'http://:8080',
            GOMEMLIMIT: `${Math.floor(limits.web * 0.75)}MiB`,
          },
          depends_on: ['api'],
        },
      },
      networks: { default: { internal: true } },
    };
    writeFileSync(join(STAGE, 'compose.json'), JSON.stringify(config));
    const profile = { ramGiB: ram, memoryLimitsMiB: limits, stages: [] };
    REPORT.profiles.push(profile);
    console.log(
      `Starting ${ram} GiB profile; application budget ${Object.values(limits).reduce((a, b) => a + b)} MiB`,
    );
    compose('up', '-d');
    await waitReady();
    compose('run', '--rm', '--no-deps', 'api', 'node', '/load/seed.cjs');
    profile.cacheIsolation = compose(
      'run',
      '--rm',
      '--no-deps',
      'api',
      'node',
      '/load/cache-check.cjs',
    );
    compose('restart', 'api');
    await waitReady();
    profile.legacyCleanup = compose(
      'run',
      '--rm',
      '--no-deps',
      '-e',
      'CACHE_CHECK_VERIFY=1',
      'api',
      'node',
      '/load/cache-check.cjs',
    );
    console.log(profile.cacheIsolation, profile.legacyCleanup);
    profile.imageLimits = compose(
      'run',
      '--rm',
      '--no-deps',
      'api',
      'node',
      '/load/image-check.cjs',
    );
    console.log(profile.imageLimits);
    const fixtureLog = compose('logs', '--no-log-prefix', 'fixture');
    console.log(fixtureLog);
    profile.fixtureLog = fixtureLog;
    for (const [mode, levels, seconds = SECONDS] of SCENARIOS) {
      compose('restart', 'postgres', 'valkey', 'cache', 'api', 'web');
      await waitReady();
      for (const concurrency of levels) {
        const measured = await measure(async () => {
          try {
            const output = await asyncRun([
              'run',
              '--rm',
              '--name',
              `${PROJECT}-client`,
              '--network',
              `${PROJECT}_default`,
              '--cpus',
              '2',
              '--cpuset-cpus',
              '2,3',
              '--memory',
              '512m',
              '--memory-swap',
              '512m',
              '-v',
              `${ROOT}/apps/api/dist:/app/dist:ro`,
              '-v',
              `${import.meta.dirname}:/load:ro`,
              '-e',
              `IMG_SIGN_SECRET=${SECRET}`,
              '-e',
              `LOAD_MODE=${mode}`,
              '-e',
              `LOAD_CONCURRENCY=${concurrency}`,
              '-e',
              `LOAD_SECONDS=${seconds}`,
              IMAGES.api,
              'node',
              '/load/client.cjs',
            ]);
            return JSON.parse(output.split('\n').at(-1));
          } catch (error) {
            return { mode, concurrency, runnerError: error.message.slice(-2000) };
          }
        });
        const states = run([
          'inspect',
          ...['api', 'postgres', 'valkey', 'cache', 'web'].map((name) => `${PROJECT}-${name}-1`),
          '--format',
          '{"name":{{json .Name}},"state":{{json .State}}}',
        ])
          .split('\n')
          .map(JSON.parse);
        measured.containerStates = Object.fromEntries(
          states.map(({ name, state }) => [
            name.split('-').at(-2),
            { running: state.Running, oomKilled: state.OOMKilled, exitCode: state.ExitCode },
          ]),
        );
        try {
          const cacheInfo = compose('exec', '-T', 'cache', 'valkey-cli', 'INFO');
          const cacheNumber = (key) =>
            Number(cacheInfo.match(new RegExp(`^${key}:(\\d+)`, 'm'))?.[1]);
          measured.cache = {
            usedMiB: mib(cacheNumber('used_memory')),
            maxMiB: mib(cacheNumber('maxmemory')),
            evictedKeys: cacheNumber('evicted_keys'),
          };
        } catch (error) {
          measured.cacheError = error.message.slice(-2000);
        }
        profile.stages.push(measured);
        save();
        console.log(JSON.stringify({ ramGiB: ram, ...measured }));
        if (
          states.some(({ state }) => !state.Running) ||
          measured.runnerError ||
          measured.cacheError ||
          measured.failures > 0 ||
          measured.p95Ms > 3000
        )
          break;
      }
    }
    compose('down', '--volumes', '--remove-orphans');
  }
} finally {
  cleanup();
  console.log(`Report: ${join(OUTPUT, 'results.json')}`);
}
