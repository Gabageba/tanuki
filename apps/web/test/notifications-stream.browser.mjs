import assert from 'node:assert/strict';
import { test } from 'node:test';
import { URL } from 'node:url';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const HARNESS = `<!doctype html><html><head></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, useNavigate, useLocation } from 'react-router';
import '/src/app/Providers/styles.ts';
import QueryClientProvider from '/src/app/Providers/QueryClientProvider.tsx';
import MantineProvider from '/src/app/Providers/MantineProvider/index.tsx';
import I18nProvider from '/src/app/Providers/I18nProvider.tsx';
import NotificationsStream from '/src/entities/notification/NotificationsStream.tsx';
import UnreadNotificationsIndicator from '/src/entities/notification/UnreadNotificationsIndicator.tsx';
import { getStreamConnected } from '/src/entities/notification/streamStatus.ts';
import { Toasts } from '/src/shared/lib/toasts/store.ts';
function Probe() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = React.useState(true);
  const [indicator, setIndicator] = React.useState(new URLSearchParams(globalThis.window.location.search).has('indicator'));
  React.useLayoutEffect(() => {
    globalThis.window.harness = { client, navigate, setLoggedIn, setIndicator, getStreamConnected, Toasts, loggedIn, path: location.pathname };
  });
  return React.createElement(React.Fragment, null,
    loggedIn && React.createElement(NotificationsStream),
    loggedIn && indicator && React.createElement(UnreadNotificationsIndicator, null, 'bell'));
}
createRoot(globalThis.document.getElementById('root')).render(React.createElement(I18nProvider, null,
  React.createElement(QueryClientProvider, null, React.createElement(MantineProvider, null,
    React.createElement(BrowserRouter, null, React.createElement(Probe))))));
</script></body></html>`;

const STOP = 'event: stop\ndata: {"reason":"connectionLimit"}\n\n';
const REMOVED = 'data: {"type":"removed","id":"00000000-0000-4000-8000-000000000001"}\n\n';

test('жизненный цикл потока уведомлений', { timeout: 120_000 }, async (t) => {
  const streams = new Map();
  const requests = new Map();
  const unreadRequests = new Map();
  const failNext = new Set();
  const errors = [];
  let unreadFails = false;
  const server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 5188 },
    plugins: [
      {
        name: 'notifications-stream-test-harness',
        configureServer(vite) {
          vite.middlewares.use(async (request, response, next) => {
            const url = new URL(request.url, 'http://localhost');
            const id = /(?:^|; )stream-client=([^;]+)/.exec(request.headers.cookie ?? '')?.[1];
            if (url.pathname === '/api/v1/notifications/stream') {
              requests.set(id, (requests.get(id) ?? 0) + 1);
              if (failNext.delete(id)) {
                response.writeHead(503);
                response.end();
                return;
              }
              response.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
              });
              response.write('retry: 1000\n\n');
              const key = Symbol(id);
              streams.set(key, { id, response });
              response.on('close', () => streams.delete(key));
              while (streams.size > 5) {
                const [oldKey, oldest] = streams.entries().next().value;
                streams.delete(oldKey);
                oldest.response.end(STOP);
              }
            } else if (url.pathname === '/api/v1/notifications/unread-count') {
              unreadRequests.set(id, (unreadRequests.get(id) ?? 0) + 1);
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = unreadFails ? 500 : 200;
              response.end(
                JSON.stringify(unreadFails ? { error: { code: 'internal' } } : { count: 2 }),
              );
            } else if (url.pathname === '/api/v1/notifications') {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ items: [], total: 0, page: 1 }));
            } else if (url.pathname.startsWith('/stream-test')) {
              response.setHeader('Content-Type', 'text/html');
              response.end(await vite.transformIndexHtml('/stream-test', HARNESS));
            } else next();
          });
        },
      },
    ],
  });
  let browser;
  const contexts = [];
  try {
    await server.listen();
    browser = await chromium.launch();
    const base = server.resolvedUrls.local[0];
    const open = async (
      id,
      { controlled = false, indicator = false, unsupported = false } = {},
    ) => {
      // Отдельные контексты обходят HTTP/1.1-лимит браузера в шесть соединений на origin.
      const context = await browser.newContext();
      contexts.push(context);
      await context.addCookies([{ name: 'stream-client', value: id, url: base }]);
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      await page.clock.install();
      if (controlled || unsupported) await page.clock.pauseAt(new Date(Date.now() + 1000));
      await page.addInitScript(
        ({ controlled, unsupported }) => {
          globalThis.window.sources = [];
          if (unsupported) {
            globalThis.window.EventSource = undefined;
            return;
          }
          if (controlled) {
            globalThis.window.EventSource = class extends globalThis.EventTarget {
              static CLOSED = 2;
              static CONNECTING = 0;
              static OPEN = 1;
              readyState = 0;
              closes = 0;
              constructor(url) {
                super();
                this.url = url;
                globalThis.window.sources.push(this);
              }
              close() {
                this.closes++;
                this.readyState = 2;
              }
            };
          } else {
            const NativeEventSource = globalThis.window.EventSource;
            globalThis.window.EventSource = class extends NativeEventSource {
              constructor(url) {
                super(url);
                globalThis.window.sources.push(this);
              }
            };
          }
        },
        { controlled, unsupported },
      );
      await page.goto(`${base}stream-test${indicator ? '?indicator' : ''}`);
      await page.waitForFunction(() => globalThis.window.harness !== undefined);
      return page;
    };
    const connected = (page, value) =>
      page.waitForFunction(
        (value) => globalThis.window.harness.getStreamConnected() === value,
        value,
      );
    const closeAll = async () => {
      await Promise.all(contexts.splice(0).map((context) => context.close()));
      await expect.poll(() => streams.size).toBe(0);
    };
    const emitStop = (page, data = '{"reason":"connectionLimit"}', type = 'stop') =>
      page.evaluate(
        ({ data, type }) => {
          globalThis.window.sources
            .at(-1)
            .dispatchEvent(new globalThis.MessageEvent(type, { data }));
        },
        { data, type },
      );

    await t.test(
      'восемь нативных клиентов оставляют последние пять без цикла повторов',
      async (t) => {
        t.after(closeAll);
        const pages = [];
        for (let index = 0; index < 8; index++) {
          const page = await open(`native-${index}`, { indicator: index === 0 });
          await connected(page, true);
          pages.push(page);
        }
        for (const page of pages.slice(0, 3)) await connected(page, false);
        assert.equal(streams.size, 5);
        for (const page of pages) {
          await page.evaluate(() =>
            globalThis.window.harness.client.setQueryData(['notifications'], []),
          );
        }
        for (const { response } of streams.values()) response.write(REMOVED);
        for (const page of pages.slice(3)) {
          await page.waitForFunction(
            () => globalThis.window.harness.client.getQueryState(['notifications']).isInvalidated,
          );
        }
        for (const page of pages.slice(0, 3)) {
          assert.equal(
            await page.evaluate(
              () => globalThis.window.harness.client.getQueryState(['notifications']).isInvalidated,
            ),
            false,
          );
        }
        const evicted = pages[0];
        await evicted.evaluate(() => {
          globalThis.window.harness.navigate('/stream-test/another-page');
          globalThis.window.dispatchEvent(new globalThis.Event('focus'));
          globalThis.window.dispatchEvent(new globalThis.Event('offline'));
          globalThis.window.dispatchEvent(new globalThis.Event('online'));
          globalThis.document.dispatchEvent(new globalThis.Event('visibilitychange'));
        });
        await evicted.context().setOffline(true);
        await evicted.context().setOffline(false);
        await pages[7].context().close();
        await expect.poll(() => streams.size).toBe(4);
        // Реальное ожидание длиннее потолка ручного retry (30 с) и нативного retry (1 с).
        await evicted.waitForTimeout(32_000);
        assert.equal(streams.size, 4);
        assert.equal(
          [...requests.values()].reduce((sum, count) => sum + count, 0),
          8,
        );
        assert.equal(
          await evicted.evaluate(() => globalThis.window.harness.Toasts.getSnapshot().length),
          0,
        );

        const beforePoll = unreadRequests.get('native-0');
        await evicted.clock.runFor(60_001);
        await expect.poll(() => unreadRequests.get('native-0')).toBeGreaterThan(beforePoll);
        unreadFails = true;
        await evicted.clock.runFor(62_001);
        await expect.poll(() => unreadRequests.get('native-0')).toBeGreaterThan(beforePoll + 1);
        await evicted.waitForFunction(
          () =>
            globalThis.window.harness.client.getQueryState(['notifications-unread-count'])
              .status === 'error',
        );
        assert.equal(
          await evicted.evaluate(() => globalThis.window.harness.Toasts.getSnapshot().length),
          0,
        );
        unreadFails = false;
        await evicted.clock.resume();

        await evicted.reload();
        await connected(evicted, true);
        assert.equal(requests.get('native-0'), 2);
        assert.equal(streams.size, 5);
        await closeAll();
      },
    );

    await t.test(
      'нативный обрыв восстанавливается, HTTP 503 проходит через ручной CLOSED retry',
      async (t) => {
        t.after(closeAll);
        const page = await open('reconnect');
        await connected(page, true);
        await page.evaluate(() =>
          globalThis.window.harness.client.setQueryData(['notifications'], []),
        );
        streams.values().next().value.response.end();
        await expect.poll(() => requests.get('reconnect')).toBe(2);
        await connected(page, true);
        await page.waitForFunction(
          () => globalThis.window.harness.client.getQueryState(['notifications']).isInvalidated,
        );
        assert.equal(await page.evaluate(() => globalThis.window.sources.length), 1);
        failNext.add('reconnect');
        streams.values().next().value.response.end();
        await expect.poll(() => requests.get('reconnect'), { timeout: 10_000 }).toBe(4);
        await connected(page, true);
        assert.equal(await page.evaluate(() => globalThis.window.sources.length), 2);
        await closeAll();
      },
    );

    await t.test(
      'stop отменяет таймер; некорректные сигналы молчат, поздние callbacks безопасны',
      async (t) => {
        t.after(closeAll);
        const page = await open('controlled', { controlled: true });
        await page.evaluate(() => {
          const source = globalThis.window.sources[0];
          source.readyState = 1;
          source.onopen();
          globalThis.window.saved = {
            open: source.onopen,
            error: source.onerror,
            message: source.onmessage,
          };
        });
        await connected(page, true);
        for (const data of ['broken json', '{}', '{"reason":"other"}', 'null'])
          await emitStop(page, data);
        await emitStop(page, '{"reason":"connectionLimit"}', 'unknown');
        await connected(page, true);
        await page.evaluate(() => {
          const source = globalThis.window.sources[0];
          source.readyState = 2;
          const setTimeout = globalThis.window.setTimeout;
          globalThis.window.setTimeout = (callback, delay, ...args) => {
            globalThis.window.saved.timer = callback;
            return setTimeout(callback, delay, ...args);
          };
          source.onerror();
          source.onerror();
          globalThis.window.setTimeout = setTimeout;
        });
        await emitStop(page);
        await emitStop(page);
        await page.evaluate(() => {
          globalThis.window.harness.client.setQueryData(['notifications'], []);
          globalThis.window.saved.open();
          globalThis.window.saved.error();
          globalThis.window.saved.timer();
          globalThis.window.saved.message(
            new globalThis.MessageEvent('message', { data: '{"type":"removed"}' }),
          );
        });
        await page.clock.runFor(120_000);
        await connected(page, false);
        assert.deepEqual(
          await page.evaluate(() => ({
            sources: globalThis.window.sources.length,
            closes: globalThis.window.sources[0].closes,
            invalidated: globalThis.window.harness.client.getQueryState(['notifications'])
              .isInvalidated,
          })),
          { sources: 1, closes: 1, invalidated: false },
        );
        await page.evaluate(() => globalThis.window.harness.setLoggedIn(false));
        await page.waitForFunction(() => !globalThis.window.harness.loggedIn);
        assert.equal(await page.evaluate(() => globalThis.window.sources[0].closes), 1);
        await page.evaluate(() => globalThis.window.harness.setLoggedIn(true));
        await page.waitForFunction(() => globalThis.window.sources.length === 2);
        await page.evaluate(() => {
          globalThis.window.saved.timer();
          globalThis.window.saved.open();
          globalThis.window.saved.error();
          globalThis.window.sources[1].onopen();
        });
        await connected(page, true);
        assert.equal(await page.evaluate(() => globalThis.window.sources.length), 2);
        await closeAll();
      },
    );

    await t.test(
      'CLOSED имеет одну очередь с паузами до 30 с; старый источник и выход её не оживляют',
      async (t) => {
        t.after(closeAll);
        const page = await open('backoff', { controlled: true });
        await page.evaluate(() => {
          globalThis.window.saved = {
            open: globalThis.window.sources[0].onopen,
            error: globalThis.window.sources[0].onerror,
          };
        });
        for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
          const count = await page.evaluate(() => {
            const source = globalThis.window.sources.at(-1);
            source.readyState = 2;
            source.onerror();
            source.onerror();
            return globalThis.window.sources.length;
          });
          await page.clock.runFor(delay - 1);
          assert.equal(await page.evaluate(() => globalThis.window.sources.length), count);
          await page.clock.runFor(1);
          assert.equal(await page.evaluate(() => globalThis.window.sources.length), count + 1);
        }
        await page.evaluate(() => {
          globalThis.window.sources.at(-1).onopen();
          globalThis.window.saved.error();
          globalThis.window.saved.open();
        });
        await connected(page, true);
        await page.clock.runFor(60_000);
        assert.equal(await page.evaluate(() => globalThis.window.sources.length), 8);
        await page.evaluate(() => {
          const source = globalThis.window.sources.at(-1);
          source.readyState = 2;
          source.onerror();
          globalThis.window.harness.setLoggedIn(false);
        });
        await connected(page, false);
        await page.clock.runFor(60_000);
        assert.equal(await page.evaluate(() => globalThis.window.sources.length), 8);
        await closeAll();
      },
    );

    await t.test(
      'без EventSource остаётся опрос только при смонтированном колокольчике',
      async (t) => {
        t.after(closeAll);
        const page = await open('unsupported', { unsupported: true });
        await page.clock.runFor(60_001);
        assert.equal(unreadRequests.get('unsupported'), undefined);
        assert.equal(requests.get('unsupported'), undefined);
        await page.evaluate(() => globalThis.window.harness.setIndicator(true));
        await expect.poll(() => unreadRequests.get('unsupported')).toBe(1);
        await page.clock.runFor(60_001);
        await expect.poll(() => unreadRequests.get('unsupported')).toBe(2);
        await page.evaluate(() => globalThis.window.harness.setIndicator(false));
        await page.clock.runFor(120_000);
        assert.equal(unreadRequests.get('unsupported'), 2);
        await closeAll();
      },
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    for (const { response } of streams.values()) response.end();
    await server.close();
  }
});
