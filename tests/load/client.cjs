const { buildSignedImageUrl } = require('/app/dist/img-proxy/sign.util');
const ORIGIN = 'http://web:8080';
const cookie = (user) => `tanuki_session=load-session-${user % 200}`;
const request = (path, user = 0, options = {}) =>
  fetch(`${ORIGIN}${path}`, {
    ...options,
    headers: { cookie: cookie(user), ...options.headers },
    signal: AbortSignal.timeout(5000),
  });
const json = async (path) => {
  const response = await request(path);
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
};

const main = async () => {
  const mode = process.env.LOAD_MODE;
  const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 1);
  const seconds = Number(process.env.LOAD_SECONDS ?? 15);
  const title = (await json('/api/v1/sources/acomics/titles')).items[0];
  if (!title?.id) throw new Error('Fixture catalog is empty');
  const titlePath = `/api/v1/titles/${title.id}`;
  const chapter = (await json(`${titlePath}/chapters`)).items[0];
  if (!chapter?.id) throw new Error('Fixture chapters are empty');
  const pagesPath = `${titlePath}/chapters/${chapter.id}/pages`;
  await json(pagesPath);
  const paths = [
    '/api/v1/auth/me',
    '/api/v1/sources/acomics/titles',
    titlePath,
    `${titlePath}/chapters`,
    pagesPath,
    '/api/v1/user-settings',
    '/api/v1/reading-progress/recent',
  ];
  const times = [];
  const statuses = {};
  let bytes = 0;
  let next = 0;
  let failures = 0;
  let stopped = false;
  const started = performance.now();
  const until = started + seconds * 1000;
  const phase = `${Date.now()}-${mode}`;
  await Promise.all(
    Array.from({ length: concurrency }, async (_, worker) => {
      while (performance.now() < until && !stopped) {
        const id = next++;
        let path;
        let options = {};
        if (mode === 'pages' || mode === 'covers') {
          path = buildSignedImageUrl(
            process.env.IMG_SIGN_SECRET,
            'acomics',
            `http://fixture:4080/image.jpg?key=${phase}-${id}`,
            mode === 'covers' ? { width: 480, format: 'webp' } : undefined,
          );
        } else if (mode === 'login') {
          path = '/api/v1/auth/login';
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login: `load_${id % 200}`,
              password: 'Load-password-123',
              remember: false,
            }),
          };
        } else if (id % 8 === 7) {
          path = `${titlePath}/progress`;
          options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId: chapter.id, pageIndex: 0 }),
          };
        } else {
          path = paths[id % paths.length];
        }
        const start = performance.now();
        let status = 'network';
        try {
          const response = await request(path, worker, options);
          status = String(response.status);
          // Stream the body to avoid the load generator retaining many multi-MB images.
          for await (const chunk of response.body ?? []) bytes += chunk.length;
        } catch {
          // A 200 header followed by a truncated image is still a failed request.
          status = 'network';
        }
        times.push(performance.now() - start);
        statuses[status] = (statuses[status] ?? 0) + 1;
        if (!status.startsWith('2')) failures += 1;
        if (times.length >= 20 && failures / times.length > 0.1) stopped = true;
      }
    }),
  );
  const elapsed = (performance.now() - started) / 1000;
  times.sort((a, b) => a - b);
  const percentile = (p) =>
    Math.round(times[Math.min(times.length - 1, Math.floor(times.length * p))] ?? 0);
  console.log(
    JSON.stringify({
      mode,
      concurrency,
      elapsedSeconds: +elapsed.toFixed(2),
      requests: times.length,
      rps: +(times.length / elapsed).toFixed(1),
      failures,
      statuses,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      maxMs: Math.round(times.at(-1) ?? 0),
      megabytes: +(bytes / 1024 / 1024).toFixed(1),
    }),
  );
};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
