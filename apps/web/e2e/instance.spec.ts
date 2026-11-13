import { test, expect } from '@playwright/test';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:18025';
const CONTROL = process.env.E2E_CONTROL_URL ?? 'http://localhost:19465';
const METRICS = process.env.E2E_METRICS_URL ?? 'http://localhost:19464';
const FIXTURE = process.env.E2E_FIXTURE_URL ?? 'http://localhost:14080';
const PASSWORD = 'Fixture-password-123';

test('приглашение → email → каталог → чтение → постоянные данные и офлайн', async ({
  page,
  context,
  request,
}) => {
  await page.goto(process.env.E2E_INVITE_URL!);
  await page.getByPlaceholder('Почта', { exact: true }).fill('owner@example.org');
  await page.getByPlaceholder('Имя пользователя', { exact: true }).fill('fixture_owner');
  await page.getByPlaceholder('Пароль', { exact: true }).fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByText('Проверьте почту', { exact: true })).toBeVisible();
  const messages = await request.get(`${MAILPIT}/api/v1/messages`);
  const list = await messages.json();
  expect(list.messages).toHaveLength(1);
  const email = await (
    await request.get(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)
  ).json();
  const verify = String(email.Text).match(
    /http:\/\/[^/\s]+\/verify-email\?token=[a-zA-Z0-9_-]+/,
  )?.[0];
  expect(verify).toBeTruthy();
  await page.goto(verify!);
  await expect(page).not.toHaveURL(/verify-email/, { timeout: 20_000 });
  await page.goto('/catalog/acomics');
  await expect(page.getByText('Тестовый комикс').filter({ visible: true }).first()).toBeVisible();
  const catalog = await (await context.request.get('/api/v1/sources/acomics/titles')).json();
  const title = catalog.items[0];
  expect(title.id).toBeTruthy();
  const stream = await context.request.get('/api/v1/search?query=fixture&sources=acomics');
  expect(await stream.text()).toContain('event: group');
  await page.goto(`/title/${title.id}`);
  await expect(page.getByText('Тестовый комикс').filter({ visible: true }).first()).toBeVisible();
  const chapters = await (await context.request.get(`/api/v1/titles/${title.id}/chapters`)).json();
  const chapter = chapters.items[0];
  const pages = await (
    await context.request.get(`/api/v1/titles/${title.id}/chapters/${chapter.id}/pages`)
  ).json();
  const image = await context.request.get(pages.items[0].url);
  expect(image.ok()).toBeTruthy();
  expect(image.headers()['content-type']).toContain('image/');
  const folders = await (await context.request.get('/api/v1/bookmark-folders')).json();
  expect(
    (
      await context.request.put(`/api/v1/titles/${title.id}/bookmark`, {
        data: { folderId: folders.items[0].id },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await context.request.put(`/api/v1/titles/${title.id}/progress`, {
        data: { chapterId: chapter.id, pageIndex: 0 },
      })
    ).ok(),
  ).toBeTruthy();
  await page.reload();
  expect(
    (await (await context.request.get(`/api/v1/titles/${title.id}/progress`)).json()).own.chapterId,
  ).toBe(chapter.id);
  const me = await (await context.request.get('/api/v1/auth/me')).json();
  const controlHeaders = { authorization: `Bearer ${process.env.E2E_METRICS_TOKEN}` };
  await page.evaluate(() => {
    const state = { messages: 0, pings: 0, opens: 0, stops: 0, streams: [] as EventSource[] };
    Object.assign(window, { e2eStream: state });
    const source = new EventSource('/api/v1/notifications/stream');
    source.onmessage = () => {
      state.messages += 1;
    };
    source.onopen = () => {
      state.opens += 1;
    };
    source.addEventListener('ping', () => {
      state.pings += 1;
    });
    source.addEventListener('stop', () => {
      state.stops += 1;
      source.close();
    });
    state.streams.push(source);
  });
  const streamState = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            e2eStream: { messages: number; pings: number; opens: number; stops: number };
          }
        ).e2eStream,
    );
  await expect.poll(async () => (await streamState()).opens).toBe(1);
  await request.get(`${CONTROL}/publish?user=${me.id}`, { headers: controlHeaders });
  await expect.poll(async () => (await streamState()).messages).toBeGreaterThan(0);
  await expect
    .poll(async () => (await streamState()).pings, { timeout: 30_000 })
    .toBeGreaterThan(0);
  await page.evaluate(() =>
    (window as unknown as { e2eStream: { streams: EventSource[] } }).e2eStream.streams.forEach(
      (source) => source.close(),
    ),
  );
  // The real app hook reconnects after a deployment's 502; a bare EventSource may stop.
  const reconnected = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/notifications/stream') && response.status() === 200,
    { timeout: 40_000 },
  );
  await request.get(`${CONTROL}/restart`, { headers: controlHeaders });
  await reconnected;
  expect(
    (await (await context.request.get(`/api/v1/titles/${title.id}/progress`)).json()).own.chapterId,
  ).toBe(chapter.id);
  await page.evaluate(() => {
    const state = (
      window as unknown as { e2eStream: { streams: EventSource[]; opens: number; stops: number } }
    ).e2eStream;
    const source = new EventSource('/api/v1/notifications/stream');
    source.onopen = () => {
      state.opens += 1;
    };
    source.addEventListener('stop', () => {
      state.stops += 1;
      source.close();
    });
    state.streams.push(source);
  });
  await expect.poll(async () => (await streamState()).opens).toBe(2);
  await page.evaluate(() => {
    const state = (window as unknown as { e2eStream: { streams: EventSource[] } }).e2eStream;
    for (let i = 0; i < 6; i += 1) {
      const source = new EventSource('/api/v1/notifications/stream');
      source.addEventListener('stop', () => source.close());
      state.streams.push(source);
    }
  });
  await expect.poll(async () => (await streamState()).stops).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { e2eStream: { streams: EventSource[] } }).e2eStream.streams.forEach(
      (source) => source.close(),
    ),
  );
  // Download through the actual UI/worker, then reload the installed app with networking off.
  await page.getByRole('tab', { name: 'Главы', exact: true }).click();
  const download = page.getByRole('button', { name: 'Скачать главу', exact: true });
  await expect(download).toBeVisible();
  await download.click();
  await expect(
    page.getByRole('button', { name: /Глава скачана|Удалить скачанную главу/ }).first(),
  ).toBeVisible({ timeout: 30_000 });
  const reader = `/title/${title.id}/read/${chapter.id}`;
  await page.goto(reader);
  const firstPage = page.getByRole('img', { name: 'Страница 1 из 2', exact: true });
  await expect(firstPage).toBeVisible();
  await expect
    .poll(() => firstPage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await context.setOffline(true);
  await page.goto(`${reader}?page=2`);
  const secondPage = page.getByRole('img', { name: 'Страница 2 из 2', exact: true });
  await expect(secondPage).toBeVisible();
  await expect
    .poll(() => secondPage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(
          async ({ userId, titleId }) =>
            new Promise<number | undefined>((resolve) => {
              const open = indexedDB.open(`tanuki-offline-${userId}`);
              open.onsuccess = () => {
                const database = open.result;
                const read = database
                  .transaction('pendingProgress')
                  .objectStore('pendingProgress')
                  .get(titleId);
                read.onsuccess = () => {
                  resolve(read.result?.pageIndex);
                  database.close();
                };
              };
            }),
          { userId: me.id, titleId: title.id },
        ),
      { timeout: 15_000 },
    )
    .toBe(1);
  await page.reload();
  // A direct reader reload opens the chapter's first page; the app consumes ?page once.
  await expect(firstPage).toBeVisible();
  await expect
    .poll(() => firstPage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await page.goto(`${reader}?page=2`);
  await expect(secondPage).toBeVisible();
  await context.setOffline(false);
  await expect
    .poll(
      async () =>
        (await (await context.request.get(`/api/v1/titles/${title.id}/progress`)).json()).own
          .pageIndex,
      { timeout: 20_000 },
    )
    .toBe(1);
  await context.request.post('/api/v1/auth/logout');
  expect(
    (
      await context.request.post('/api/v1/auth/login', {
        data: { login: 'fixture_owner', password: PASSWORD, remember: true },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (await (await context.request.get(`/api/v1/titles/${title.id}/bookmark`)).json()).folderId,
  ).toBe(folders.items[0].id);
});

test('noindex, отдельная конфигурация, закрытые метрики и корректный fallback', async ({
  request,
}) => {
  for (const path of ['/', '/login', '/title/unknown']) {
    const response = await request.get(path, { headers: { accept: 'text/html' } });
    expect(response.headers()['x-robots-tag']).toBe('noindex');
    expect(await response.text()).toContain('name="robots" content="noindex"');
  }
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  for (const path of ['/metrics', '/assets/missing.js', '/api/v1/missing']) {
    const response = await request.get(path, { headers: { accept: 'text/html' } });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(await response.text()).not.toContain('<!doctype html>');
  }
  const runtime = await request.get('/runtime-config.js');
  expect(runtime.headers()['cache-control']).toBe('no-store');
  expect(await runtime.text()).not.toMatch(/METRICS_TOKEN|SMTP_PASSWORD|SOURCE_SECRETS_KEY/);
  expect((await request.get(`${METRICS}/metrics`)).status()).toBe(401);
  expect(
    (
      await request.get(`${METRICS}/metrics`, {
        headers: { authorization: `Bearer ${process.env.E2E_METRICS_TOKEN}` },
      })
    ).status(),
  ).toBe(200);
});

test('ошибки настоящего парсера: fallback, background, probe, cache hit и очистка Sentry', async ({
  request,
}) => {
  const headers = { authorization: `Bearer ${process.env.E2E_METRICS_TOKEN}` };
  const control = (query: string) => request.get(`${CONTROL}/telemetry?${query}`, { headers });
  expect((await control('context=request')).ok()).toBeTruthy();
  await request.get(`${FIXTURE}/control?broken=true`);
  const before = await (await request.get(`${METRICS}/metrics`, { headers })).text();
  // Fresh cache never invokes the parser, even when the source has just broken.
  expect((await control('context=request')).ok()).toBeTruthy();
  // Process memory gauges change between scrapes; cache hits must preserve parser metrics.
  const parserMetrics = (metrics: string) =>
    metrics
      .split('\n')
      .filter((line) => !line.startsWith('tanuki_process_memory_bytes{'))
      .join('\n');
  const after = await (await request.get(`${METRICS}/metrics`, { headers })).text();
  expect(parserMetrics(after)).toBe(parserMetrics(before));
  for (const context of ['request', 'background']) {
    const fallback = await (await control(`context=${context}&force=true`)).json();
    expect(fallback.stale).toBe(true);
  }
  expect((await control('context=probe')).ok()).toBeTruthy();
  const metrics = await (await request.get(`${METRICS}/metrics`, { headers })).text();
  for (const context of ['request', 'background', 'probe']) {
    expect(metrics).toContain(`source_id="acomics",operation="getPages",context="${context}"} 1`);
  }
  const envelopes = await (await request.get(`${FIXTURE}/events`)).json();
  const events = envelopes
    .flatMap((envelope: string) =>
      envelope
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line)),
    )
    .filter((event: { exception?: unknown }) => event.exception);
  expect(events).toHaveLength(3);
  expect(JSON.stringify(events)).not.toMatch(
    /secret@example|private|token=|fixture\/|authorization|cookie|breadcrumbs/i,
  );
  await request.get(`${FIXTURE}/control?broken=false`);
});
