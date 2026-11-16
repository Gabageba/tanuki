import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { chromium, expect } from '@playwright/test';
import { getResponse } from 'msw';
import { createServer } from 'vite';

let server;
let browser;
let origin;
let fixtures;
let handlers;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'error',
  });
  await server.listen();
  origin = server.resolvedUrls.local[0].replace(/\/$/, '');
  ({ DEFAULT_HANDLERS: handlers } = await server.ssrLoadModule(
    '/src/shared/storybook/handlers.ts',
  ));
  fixtures = await server.ssrLoadModule('/src/shared/storybook/fixtures.ts');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const openPage = async (path, width = 1280) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
    locale: 'ru-RU',
    viewport: { width, height: 900 },
  });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    requests.push(new URL(request.url()));
    const response = await getResponse(
      handlers,
      new globalThis.Request(request.url(), {
        method: request.method(),
        headers: request.headers(),
        body: request.postDataBuffer() ?? undefined,
      }),
      { baseUrl: origin },
    );
    assert.ok(response, `Нет мока для ${request.url()}`);
    if (new URL(request.url()).pathname === '/api/v1/sources/readmanga_ru') {
      const source = await response.json();
      await route.fulfill({
        json: { ...source, sortOrders: ['updated', 'rating'], supportsDirection: true },
      });
      return;
    }
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
  await page.goto(`${origin}${path}`);
  return { page, requests, errors, close: () => context.close() };
};

for (const width of [1280, 375]) {
  test(`закладки сохраняют сортировку между папками, после тайтла и перезагрузки, ${width}px`, async () => {
    const run = await openPage('/bookmarks?sort=alphabetical&direction=asc&query=Тест', width);
    const { page } = run;
    try {
      await expect(page.getByPlaceholder('Поиск по названию')).toHaveValue('Тест');
      await expect(page.getByRole('button', { name: 'Сортировка', exact: true })).toContainText(
        'алфавиту',
      );
      await page.getByRole('button', { name: 'Сортировка', exact: true }).click();
      await page.getByRole('option', { name: 'По чтению', exact: true }).click();
      await expect(page).toHaveURL(/sort=read/);
      await expect(page).toHaveURL(/direction=desc/);
      await page.getByRole('button', { name: 'Сортировка', exact: true }).click();
      await page.getByRole('option', { name: 'По алфавиту', exact: true }).click();
      const folders = page.getByRole('tab');
      await folders.nth(1).click();
      await expect(page).toHaveURL(/sort=alphabetical/);
      await expect(page).toHaveURL(/direction=asc/);
      await expect(page.getByPlaceholder('Поиск по названию')).toHaveValue('');
      await page.getByPlaceholder('Поиск по названию').pressSequentially('Манга');
      await expect(page.getByPlaceholder('Поиск по названию')).toHaveValue('Манга');
      const saved = page.url();
      await page.locator('a[href^="/title/"]').first().click();
      await expect(page).toHaveURL(/\/title\//);
      if (width < 768) {
        await page.getByRole('button', { name: 'Закладки', exact: true }).click();
      } else {
        await page.getByRole('link', { name: 'Закладки', exact: true }).click();
      }
      await expect(page).toHaveURL(saved);
      await page.reload();
      await expect(page.getByRole('button', { name: 'Сортировка', exact: true })).toContainText(
        'алфавиту',
      );
      assert.deepEqual(run.errors, []);
    } finally {
      await run.close();
    }
  });
}

test('каталог возвращается с тайтла с фильтрами и восстанавливает query при переходах по истории', async () => {
  const run = await openPage(
    '/catalog/readmanga_ru?order=rating&direction=asc&filters=genres:action',
  );
  const { page } = run;
  try {
    await expect(page.getByRole('button', { name: 'Сортировка', exact: true })).toBeVisible();
    const saved = page.url();
    await page.locator('a[href^="/title/"]').first().click();
    await expect(page).toHaveURL(/\/title\//);
    const catalogLink = page.locator('a[href^="/catalog/readmanga_ru"]:visible').first();
    await expect(catalogLink).toHaveAttribute('href', saved.replace(origin, ''));
    await catalogLink.click();
    await expect(page).toHaveURL(saved);
    assert.ok(
      run.requests.some(
        (url) =>
          url.pathname.endsWith('/titles') &&
          url.searchParams.getAll('filters').includes('genres:action'),
      ),
    );

    const search = page.getByPlaceholder(/Искать в/);
    await search.fill('Манга');
    await expect(page).toHaveURL(/query=/);
    const withSearch = page.url();
    // Несколько записей одного маршрута воспроизводят back/forward без размонтирования страницы.
    await page.evaluate((url) => {
      globalThis.window.history.pushState(globalThis.window.history.state, '', url);
      globalThis.window.dispatchEvent(
        new globalThis.window.PopStateEvent('popstate', { state: globalThis.window.history.state }),
      );
    }, saved);
    await expect(search).toHaveValue('');
    await page.goBack();
    await expect(page).toHaveURL(withSearch);
    await expect(search).toHaveValue('Манга');
    assert.deepEqual(run.errors, []);
  } finally {
    await run.close();
  }
});

test('таблицы управления хранят независимые фильтры и страницы в URL', async () => {
  const run = await openPage(
    '/management?tab=users&users.query=tanuki&users.sort=username&users.direction=asc&users.page=2&invites.sort=role&invites.page=3',
  );
  const { page } = run;
  try {
    await expect(page.getByPlaceholder('Имя или почта')).toHaveValue('tanuki');
    await page.getByRole('tab', { name: 'Приглашения', exact: true }).click();
    await expect(page).toHaveURL(/users.page=2/);
    await expect(page).toHaveURL(/invites.page=3/);
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Приглашения', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'Пользователи', exact: true }).click();
    await expect(page.getByPlaceholder('Имя или почта')).toHaveValue('tanuki');
    await expect
      .poll(() =>
        run.requests.some(
          (url) =>
            url.pathname.endsWith('/users') &&
            url.searchParams.get('page') === '2' &&
            url.searchParams.get('query') === 'tanuki',
        ),
      )
      .toBe(true);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.close();
  }
});

test('открытие и закрытие карточки здоровья источника сохраняет фильтры и сортировку', async () => {
  const sourceId = fixtures.SOURCES[0].id;
  const run = await openPage(
    `/sources/health?status=ok&sort=title&direction=desc&source=${sourceId}`,
  );
  const { page } = run;
  try {
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await drawer.locator('button').first().click();
    await expect(drawer).not.toBeVisible();
    await expect(page).toHaveURL(/status=ok/);
    await expect(page).toHaveURL(/sort=title/);
    await expect(page).toHaveURL(/direction=desc/);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.close();
  }
});

test('уведомления сохраняют категории после перехода на тайтл и возврата через шапку', async () => {
  const run = await openPage('/notifications?categories=chapters');
  const { page } = run;
  try {
    await expect(page.getByRole('combobox', { name: 'Категории' })).toBeVisible();
    await expect
      .poll(() =>
        run.requests.some(
          (url) =>
            url.pathname === '/api/v1/notifications' &&
            url.searchParams.get('category') === 'chapters',
        ),
      )
      .toBe(true);
    await page.locator('.mantine-MultiSelect-input').click();
    await page.getByRole('option', { name: 'Аккаунт', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => new URL(page.url()).searchParams.getAll('categories'))
      .toEqual(['chapters', 'account']);
    const saved = page.url();
    await page.locator('a[href^="/title/"]').first().click();
    await expect(page).toHaveURL(/\/title\//);
    await page.getByRole('link', { name: 'Уведомления', exact: true }).click();
    await expect(page).toHaveURL(saved);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.close();
  }
});

test('период статистики сохраняется между вкладками профиля и после перезагрузки', async () => {
  const run = await openPage('/profile?period=month');
  const { page } = run;
  try {
    await expect(page.getByRole('radio', { name: 'Месяц', exact: true })).toBeChecked();
    await page.getByText('Год', { exact: true }).click();
    await expect(page).toHaveURL(/period=year/);
    await page.getByRole('tab', { name: 'Данные', exact: true }).click();
    await expect(page).toHaveURL(/period=year/);
    await page.getByRole('tab', { name: 'Статистика', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Год', exact: true })).toBeChecked();
    assert.deepEqual(run.errors, []);
  } finally {
    await run.close();
  }
});
