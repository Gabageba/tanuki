import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Buffer } from 'node:buffer';
import { fileURLToPath, URL } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { getResponse } from 'msw';
import { createServer } from 'vite';

let server;
let browser;
let origin;
let handlers;
let title;
let chapter;

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
  ({ TITLE: title, READING_CHAPTER: chapter } = await server.ssrLoadModule(
    '/src/shared/storybook/titles.ts',
  ));
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const openReader = async ({ horizontal = false, resumePage = 1, spread = false } = {}) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
    viewport: { width: 375, height: 800 },
    hasTouch: true,
    locale: 'ru-RU',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
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
    if (request.url().endsWith('/reader-settings')) {
      await route.fulfill({
        json: {
          ...(await response.json()),
          readingMode: horizontal ? 'horizontal' : 'vertical',
          pageFit: horizontal ? 'fitHeight' : 'fitWidth',
          pageLayout: spread ? 'spread' : 'single',
          pageGap: 16,
          autoNextChapter: false,
        },
      });
    } else {
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: Buffer.from(await response.arrayBuffer()),
      });
    }
  });
  await page.goto(
    `${origin}/title/${encodeURIComponent(title.id)}/read/${encodeURIComponent(chapter.id)}?page=${resumePage}`,
  );
  await expect(page.locator('main img').first()).toBeVisible();
  await expect(page.locator('header')).toContainText('Берсерк');
  await expect(page.locator('main img').first()).toHaveJSProperty('complete', true);
  const cdp = await context.newCDPSession(page);
  const touch = (type, points = []) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map(([x, y, id]) => ({ x, y, id })),
    });
  return { page, touch, errors, close: () => context.close() };
};

const layer = (page) => page.locator('main [style*="scale("]');
const scale = (page) =>
  layer(page).evaluate(
    (element) => new globalThis.DOMMatrix(globalThis.getComputedStyle(element).transform).a,
  );
const localPoint = (element, point) =>
  element.evaluate((node, { x, y }) => {
    const rect = node.getBoundingClientRect();
    return { x: (x - rect.left) / rect.width, y: (y - rect.top) / rect.height };
  }, point);
const expectAnchor = async (element, local, point) => {
  await expect
    .poll(async () => {
      const box = await element.boundingBox();
      return Math.max(
        Math.abs(box.x + box.width * local.x - point.x),
        Math.abs(box.y + box.height * local.y - point.y),
      );
    })
    .toBeLessThan(2);
};

for (const horizontal of [false, true]) {
  test(`pinch держит точку под пальцами: ${horizontal ? 'постранично' : 'лента'}`, async () => {
    const reader = await openReader({ horizontal });
    const { page, touch } = reader;
    try {
      const image = page.locator('main img').first();
      const anchor = { x: 130, y: 300 };
      const local = await localPoint(image, anchor);
      const initialHeight = await page.evaluate(
        () => globalThis.document.documentElement.scrollHeight,
      );
      await touch('touchStart', [
        [80, 300, 1],
        [180, 300, 2],
      ]);
      await touch('touchMove', [
        [30, 300, 1],
        [230, 300, 2],
      ]);
      await expect.poll(() => scale(page)).toBe(2);
      await expectAnchor(image, local, anchor);
      // Translate the midpoint without changing the distance between fingers.
      await touch('touchMove', [
        [50, 340, 1],
        [250, 340, 2],
      ]);
      await expectAnchor(image, local, { x: 150, y: 340 });
      // One remaining finger continues panning without a new touch or page turn.
      await touch('touchEnd', [[250, 340, 2]]);
      await touch('touchMove', [[80, 370, 1]]);
      await expectAnchor(image, local, { x: 180, y: 370 });
      await touch('touchEnd');
      assert.equal(await page.evaluate(() => globalThis.window.visualViewport.scale), 1);
      assert.equal(
        await page.evaluate(() => globalThis.document.documentElement.scrollHeight),
        initialHeight,
      );
      assert.deepEqual(reader.errors, []);
    } finally {
      await reader.close();
    }
  });
}

test('зум прокрученной ленты удерживает точку и масштабирует соседние страницы вместе', async () => {
  const reader = await openReader({ resumePage: 3 });
  const { page, touch } = reader;
  try {
    const slots = page.locator('main [data-reader-page-key]');
    const current = slots.nth(2);
    await expect.poll(async () => Math.abs((await current.boundingBox()).y)).toBeLessThan(2);
    const anchor = { x: 140, y: 300 };
    const local = await localPoint(current, anchor);
    const original = await slots.nth(3).boundingBox();
    const scrollY = await page.evaluate(() => globalThis.window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
    await touch('touchStart', [
      [90, 300, 1],
      [190, 300, 2],
    ]);
    await touch('touchMove', [
      [40, 300, 1],
      [240, 300, 2],
    ]);
    await touch('touchEnd');
    await expect.poll(() => scale(page)).toBe(2);
    await expectAnchor(current, local, anchor);
    expect((await slots.nth(3).boundingBox()).width).toBeCloseTo(original.width * 2, 0);
    // Panning across a page boundary must not let progress observation reset the zoom.
    await page.mouse.move(180, 600);
    await page.mouse.down();
    await page.mouse.move(180, 100, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => scale(page)).toBe(2);
    await page.waitForTimeout(300);
    assert.equal(await scale(page), 2);
    assert.equal(await page.evaluate(() => globalThis.window.scrollY), scrollY);
    await page.mouse.dblclick(140, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(1);
    await expect.poll(async () => Math.abs((await current.boundingBox()).y)).toBeLessThan(2);
    assert.deepEqual(reader.errors, []);
  } finally {
    await reader.close();
  }
});

test('двойной тап приближает место тапа, смена страницы и поворот экрана сбрасывают зум', async () => {
  const reader = await openReader({ horizontal: true, spread: true });
  const { page } = reader;
  try {
    const slot = page.locator('main [data-reader-page-key]').first();
    const anchor = { x: 130, y: 300 };
    const local = await localPoint(slot, anchor);
    await page.mouse.dblclick(anchor.x, anchor.y, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(2);
    await expectAnchor(slot, local, anchor);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => scale(page)).toBe(1);
    await page.mouse.dblclick(130, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(2);
    await page.setViewportSize({ width: 800, height: 375 });
    await expect.poll(() => scale(page)).toBe(1);
    assert.deepEqual(reader.errors, []);
  } finally {
    await reader.close();
  }
});

test('обычная вертикальная прокрутка работает до и после зума', async () => {
  const reader = await openReader();
  const { page, touch } = reader;
  try {
    const swipe = async () => {
      await touch('touchStart', [[180, 600, 1]]);
      for (const y of [550, 500, 450, 400, 350]) await touch('touchMove', [[180, y, 1]]);
      await touch('touchEnd');
    };
    await swipe();
    await expect.poll(() => page.evaluate(() => globalThis.window.scrollY)).toBeGreaterThan(100);
    await page.mouse.dblclick(130, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(2);
    await page.mouse.dblclick(130, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(1);
    const initial = await page.evaluate(() => globalThis.window.scrollY);
    await swipe();
    await expect
      .poll(() => page.evaluate(() => globalThis.window.scrollY))
      .toBeGreaterThan(initial + 100);
    assert.deepEqual(reader.errors, []);
  } finally {
    await reader.close();
  }
});

test('быстрые повторные pinch не накапливают старые кадры и возвращают обычное управление', async () => {
  const reader = await openReader({ horizontal: true });
  const { page, touch } = reader;
  try {
    const initialPage = await page
      .locator('main [data-reader-page-key]')
      .getAttribute('data-reader-page-key');
    for (let repeat = 0; repeat < 8; repeat++) {
      await touch('touchStart', [
        [140, 300, 1],
        [180, 300, 2],
      ]);
      for (const offset of [40, 90, 140, 60, 10, 0]) {
        await touch('touchMove', [
          [140 - offset, 300, 1],
          [180 + offset, 300, 2],
        ]);
      }
      await touch('touchEnd');
    }
    await expect.poll(() => scale(page)).toBe(1);
    await expect(page.locator('main')).toHaveCSS('touch-action', 'pan-y');
    await expect(page.locator('main [data-reader-page-key]')).toHaveAttribute(
      'data-reader-page-key',
      initialPage,
    );
    await page.mouse.dblclick(130, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(2);
    await page.mouse.dblclick(130, 300, { delay: 60 });
    await expect.poll(() => scale(page)).toBe(1);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('main [data-reader-page-key]')).not.toHaveAttribute(
      'data-reader-page-key',
      initialPage,
    );
    assert.deepEqual(reader.errors, []);
  } finally {
    await reader.close();
  }
});

for (const horizontal of [false, true]) {
  test(`зум сохраняется после скелетона перезапроса: ${horizontal ? 'постранично' : 'лента'}`, async () => {
    const reader = await openReader({ horizontal });
    const { page } = reader;
    const response = Promise.withResolvers();
    try {
      await page.mouse.dblclick(130, 300, { delay: 60 });
      await expect.poll(() => scale(page)).toBe(2);
      const initialTransform = await layer(page).evaluate((element) => element.style.transform);
      await page.route('**/api/v1/reader-settings', async (route) => {
        await response.promise;
        await route.fallback();
      });
      // Expire the settings cache without waiting a real minute or changing timer behavior.
      await page.clock.setSystemTime(new Date(Date.now() + 61_000));
      await Promise.all([
        page.waitForRequest('**/api/v1/reader-settings'),
        page.evaluate(() => {
          globalThis.window.dispatchEvent(new globalThis.Event('visibilitychange'));
        }),
      ]);
      await expect(layer(page)).toHaveCount(0);
      response.resolve();
      await expect(layer(page)).toHaveCount(1);
      await expect.poll(() => scale(page)).toBe(2);
      assert.equal(
        await layer(page).evaluate((element) => element.style.transform),
        initialTransform,
      );
      await expect(page.locator('main')).toHaveCSS('touch-action', 'none');
      await page.mouse.dblclick(130, 300, { delay: 60 });
      await expect.poll(() => scale(page)).toBe(1);
      await expect(page.locator('main')).toHaveCSS('touch-action', 'pan-y');
      assert.deepEqual(reader.errors, []);
    } finally {
      response.resolve();
      await reader.close();
    }
  });
}
