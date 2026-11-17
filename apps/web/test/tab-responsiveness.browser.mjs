import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import process from 'node:process';
import { URL } from 'node:url';
import { chromium, webkit, expect } from '@playwright/test';
import { createServer } from 'vite';

const HARNESS = `<!doctype html><html><head></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, Tabs, Box } from '@mantine/core';
import '@mantine/core/styles.css';
import SwipeableTabs from '/src/shared/ui/SwipeableTabs/index.tsx';
import QueryBlock from '/src/shared/ui/QueryBlock/index.tsx';
const h = React.createElement;
let release;
let blocked = true;
const gate = new Promise(resolve => { release = resolve; });
globalThis.harness = { release: () => { blocked = false; release(); } };
const TABS = ['first', 'second', 'third'];
function CommitGate({ value }) {
  if (blocked && value !== 'first') throw gate;
  return null;
}
function Example() {
  const [value, setValue] = React.useState('first');
  const [fetching, setFetching] = React.useState(false);
  React.useLayoutEffect(() => {
    globalThis.harness.committed = value;
    globalThis.harness.setValue = setValue;
    globalThis.harness.setFetching = setFetching;
  }, [value]);
  const query = {data: value, isError: false, error: null, isPlaceholderData: false,
    fetchStatus: fetching ? 'fetching' : 'idle', refetch: () => {}};
  const onChange = next => React.startTransition(() => { setValue(next); setFetching(false); });
  return h(SwipeableTabs, {value, onChange},
    h(Tabs.List, null, TABS.map(id => h(Tabs.Tab, {key: id, value: id}, id))),
    h(CommitGate, {value}),
    h(Box, {mih: 300, 'data-swipe-content': true},
      h(QueryBlock, {query, skeleton: h(Box, {'data-testid': 'skeleton'}, 'Loading')},
        data => h(Box, {'data-testid': 'content'}, data))));
}

createRoot(document.getElementById('root')).render(h(MantineProvider, null,
  h(React.Suspense, {fallback: 'Initial loading'}, h(Example))));
</script></body></html>`;

let server;
let browser;

before(async () => {
  server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [
      {
        name: 'tab-responsiveness-harness',
        configureServer(vite) {
          vite.middlewares.use('/tab-responsiveness-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(await vite.transformIndexHtml('/tab-responsiveness-test', HARNESS));
          });
        },
      },
    ],
  });
  await server.listen();
  browser = await (process.env.TEST_BROWSER === 'webkit' ? webkit : chromium).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const swipe = (page, dx = -100) =>
  page.locator('[data-swipe-content]').evaluate((element, dx) => {
    const touch = (x) => ({ identifier: 1, clientX: x, clientY: 200 });
    const dispatch = (type, touches, changedTouches = touches) => {
      const event = new globalThis.Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: touches },
        changedTouches: { value: changedTouches },
      });
      element.dispatchEvent(event);
    };
    dispatch('touchstart', [touch(180)]);
    dispatch('touchmove', [touch(180 + dx)]);
    dispatch('touchend', [], [touch(180 + dx)]);
  }, dx);

for (const bySwipe of [true, false]) {
  test(`выбор и скелетон опережают заблокированный рендер страницы: ${bySwipe ? 'свайп' : 'клик'}`, async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`${server.resolvedUrls.local[0]}tab-responsiveness-test`);
      await expect(page.getByTestId('content')).toHaveText('first');
      if (bySwipe) await swipe(page);
      else await page.getByRole('tab', { name: 'second', exact: true }).click();
      // Новая страница принципиально не может закоммититься, пока gate не отпущен.
      await expect(page.getByRole('tab', { name: 'second', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: 1000 },
      );
      await expect(page.getByTestId('skeleton')).toBeVisible();
      await expect(page.getByTestId('content')).toHaveCount(0);
      assert.equal(await page.evaluate(() => globalThis.harness.committed), 'first');
      // Следующий жест во время незавершённой перерисовки тоже немедленно меняет выбор.
      await swipe(page);
      await expect(page.getByRole('tab', { name: 'third', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: 1000 },
      );
      await page.evaluate(() => globalThis.harness.release());
      await expect(page.getByTestId('content')).toHaveText('third');
      await expect(page.getByTestId('skeleton')).toHaveCount(0);
      // Внешний переход синхронизирует выбор, локальное состояние не залипает.
      await page.evaluate(() => globalThis.harness.setValue('first'));
      await expect(page.getByRole('tab', { name: 'first', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('content')).toHaveText('first');
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
}

test('скелетон прошлого запроса не задерживает готовую новую вкладку', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await context.newPage();
  try {
    await page.clock.install();
    await page.goto(`${server.resolvedUrls.local[0]}tab-responsiveness-test`);
    await expect(page.getByTestId('content')).toHaveText('first');
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.evaluate(() => globalThis.harness.setFetching(true));
    await page.clock.runFor(220);
    await expect(page.getByTestId('skeleton')).toBeVisible();
    await swipe(page);
    await page.clock.runFor(32);
    await expect(page.getByRole('tab', { name: 'second', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.evaluate(() => globalThis.harness.release());
    // До 400 мс скелетона ещё далеко. Свежая новая вкладка доступна без этого ожидания.
    await page.clock.runFor(32);
    await expect(page.getByTestId('content')).toHaveText('second');
    await expect(page.getByTestId('skeleton')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
