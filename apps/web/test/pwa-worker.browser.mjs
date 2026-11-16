import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { setTimeout } from 'node:timers';
import { test } from 'node:test';
import { chromium, expect } from '@playwright/test';

const DIST = new globalThis.URL('../dist/', import.meta.url);
const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const serveBuild = async (pathname, response, version) => {
  const file = new globalThis.URL(`.${pathname}`, DIST);
  const content = file.href.startsWith(DIST.href) && (await readFile(file).catch(() => null));
  if (!content) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader(
    'Content-Type',
    Object.entries(CONTENT_TYPES).find(([ext]) => pathname.endsWith(ext))?.[1] ??
      'application/octet-stream',
  );
  response.end(
    pathname === '/sw.js' && version ? `${content}\n// test version ${version}` : content,
  );
};

const openControlledPage = async (context, port) => {
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/harness`);
  await page.evaluate(() => globalThis.navigator.serviceWorker.register('/sw.js'));
  await page.waitForFunction(() => globalThis.navigator.serviceWorker.controller !== null);
  return page;
};

/** Настоящий собранный SW, две его версии и очередь из двух глав с задержанной страницей. */
for (const closeInitiator of [false, true])
  test(
    `SW заканчивает главу и сохраняет очередь: вкладка ${closeInitiator ? 'закрыта' : 'открыта'}`,
    { timeout: 30_000 },
    async () => {
      let version = 1;
      let heldResponse;
      const requestedChapters = [];
      const server = createServer(async (request, response) => {
        const { pathname } = new globalThis.URL(request.url, 'http://localhost');
        response.setHeader('Cache-Control', 'no-store');
        if (pathname === '/harness') {
          response.setHeader('Content-Type', 'text/html');
          response.end('<!doctype html><title>PWA test</title>');
          return;
        }
        const chapter = pathname.match(/\/chapters\/(one|two)\/pages$/)?.[1];
        if (chapter) {
          requestedChapters.push(chapter);
          response.setHeader('Content-Type', 'application/json');
          response.end(
            JSON.stringify({
              items: [1, 2].map((page) => ({
                url: `/image-${chapter}-${page}`,
                width: 1,
                height: 1,
              })),
              prevChapterId: null,
              nextChapterId: null,
            }),
          );
          return;
        }
        if (pathname.startsWith('/image-')) {
          response.setHeader('Content-Type', 'image/png');
          if (pathname === '/image-one-2') {
            heldResponse = response;
          } else response.end('page');
          return;
        }
        await serveBuild(pathname, response, version);
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      let browser;
      try {
        browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await openControlledPage(context, server.address().port);
        version = 2;
        await page.evaluate(async () =>
          (await globalThis.navigator.serviceWorker.getRegistration()).update(),
        );
        await expect
          .poll(() =>
            page.evaluate(
              async () =>
                (await globalThis.navigator.serviceWorker.getRegistration()).waiting?.state,
            ),
          )
          .toBe('installed');
        assert.equal(
          await page.evaluate(
            async () => (await globalThis.navigator.serviceWorker.getRegistration()).active.state,
          ),
          'activated',
        );

        await page.evaluate(async () => {
          await new Promise((resolve, reject) => {
            const request = globalThis.indexedDB.open('tanuki-offline-pwa-test', 10);
            request.onupgradeneeded = () => {
              const db = request.result;
              const downloads = db.createObjectStore('downloads', { keyPath: 'chapterId' });
              ['titleId', 'status', 'order'].forEach((key) => downloads.createIndex(key, key));
              db.createObjectStore('chapters', { keyPath: 'chapterId' }).createIndex(
                'titleId',
                'titleId',
              );
              const titles = db.createObjectStore('titles', { keyPath: 'titleId' });
              ['sourceId', 'createdAt'].forEach((key) => titles.createIndex(key, key));
              ['queue', 'settings'].forEach((name) =>
                db.createObjectStore(name, { keyPath: 'id' }),
              );
              db.createObjectStore('pendingProgress', { keyPath: 'titleId' });
              db.createObjectStore('skipped', { keyPath: 'chapterId' });
            };
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction(['downloads', 'chapters'], 'readwrite');
              ['one', 'two'].forEach((chapterId, order) => {
                tx.objectStore('downloads').put({
                  chapterId,
                  titleId: 'title',
                  branchId: 'main',
                  status: 'queued',
                  order,
                  pagesDone: 0,
                  pagesTotal: 0,
                  bytes: 0,
                  createdAt: '2026-11-10T00:00:00Z',
                });
                tx.objectStore('chapters').put({ chapterId, titleId: 'title' });
              });
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => reject(tx.error);
            };
          });
          globalThis.navigator.serviceWorker.controller.postMessage({
            type: 'downloadsProcess',
            userId: 'pwa-test',
          });
        });
        // Дожидаемся запроса задержанной страницы; при сбое скачивания тест завершится ошибкой.
        await expect.poll(() => Boolean(heldResponse)).toBe(true);
        assert.ok(heldResponse);
        // Другая вкладка остаётся под старым воркером и продолжает читать без перезагрузки.
        const initiator = await context.newPage();
        await initiator.goto(`http://127.0.0.1:${server.address().port}/harness`);
        await initiator.waitForFunction(
          () => globalThis.navigator.serviceWorker.controller !== null,
        );
        await page.evaluate(() => {
          globalThis.updateReady = false;
          globalThis.navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              globalThis.updateReady = true;
            },
            { once: true },
          );
        });
        await initiator.evaluate(async () => {
          const registration = await globalThis.navigator.serviceWorker.getRegistration();
          registration.waiting.postMessage('skipWaiting');
        });
        // Сообщение получено, но активация должна ждать задержанную страницу текущей главы.
        await new Promise((resolve) => setTimeout(resolve, 200));
        assert.equal(await page.evaluate(() => globalThis.updateReady), false);
        assert.equal(
          await page.evaluate(
            async () => (await globalThis.navigator.serviceWorker.getRegistration()).waiting?.state,
          ),
          'installed',
        );
        if (closeInitiator) await initiator.close();
        assert.deepEqual(requestedChapters, ['one']);
        heldResponse.end('page');
        await page.waitForFunction(() => globalThis.updateReady);
        assert.deepEqual(requestedChapters, ['one']);
        assert.equal(
          await page.evaluate(
            async () => (await (await globalThis.caches.open('tanuki-offline-v1')).keys()).length,
          ),
          2,
        );
        await page.evaluate(() => {
          globalThis.navigator.serviceWorker.controller.postMessage({
            type: 'downloadsProcess',
            userId: 'pwa-test',
          });
        });
        await expect
          .poll(() =>
            page.evaluate(async () => {
              const cache = await globalThis.caches.open('tanuki-offline-v1');
              return (await cache.keys()).length;
            }),
          )
          .toBe(4);
        assert.equal(
          await page.evaluate(
            async () => (await (await globalThis.caches.open('tanuki-offline-v1')).keys()).length,
          ),
          4,
        );
        assert.deepEqual(requestedChapters, ['one', 'two']);
        assert.equal(
          await page.evaluate(
            async () => (await globalThis.navigator.serviceWorker.getRegistration()).waiting,
          ),
          null,
        );
      } finally {
        heldResponse?.end();
        await browser?.close();
        await new Promise((resolve) => server.close(resolve));
      }
    },
  );

test(
  'SW повторяет перегруженную обложку один раз и кеширует успешный ответ',
  { timeout: 20_000 },
  async () => {
    const png = await readFile(new globalThis.URL('icon-192.png', DIST));
    const requests = new Map();
    const server = createServer(async (request, response) => {
      const { pathname, searchParams } = new globalThis.URL(request.url, 'http://localhost');
      response.setHeader('Cache-Control', 'no-store');
      if (pathname === '/harness') {
        response.setHeader('Content-Type', 'text/html');
        response.end('<!doctype html><title>PWA test</title>');
        return;
      }
      if (pathname !== '/api/v1/img') {
        await serveBuild(pathname, response);
        return;
      }

      const key = searchParams.get('u');
      const timestamps = requests.get(key) ?? [];
      timestamps.push(Date.now());
      requests.set(key, timestamps);
      if (key === 'recovering' && timestamps.length === 2) {
        response.writeHead(200, { 'Content-Type': 'image/png' }).end(png);
      } else if (key === 'forbidden') {
        response.writeHead(403).end();
      } else {
        response.writeHead(429, { 'Retry-After': '1' }).end();
      }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    let browser;
    try {
      browser = await chromium.launch();
      const page = await openControlledPage(await browser.newContext(), server.address().port);
      const cover = '/api/v1/img?u=recovering&w=360&exp=1&sig=one';
      await page.evaluate((src) => {
        const image = globalThis.document.createElement('img');
        image.src = src;
        globalThis.document.body.append(image);
      }, cover);
      await page.waitForFunction(() => globalThis.document.querySelector('img').naturalWidth > 0);
      const [first, retry] = requests.get('recovering');
      assert.ok(retry - first >= 1_000);

      const cachedCover = '/api/v1/img?u=recovering&w=360';
      await expect
        .poll(() =>
          page.evaluate(async (url) => {
            const cache = await globalThis.caches.open('tanuki-covers');
            return (await cache.match(url))?.status;
          }, cachedCover),
        )
        .toBe(200);

      const statuses = await page.evaluate(
        (paths) => Promise.all(paths.map(async (path) => (await globalThis.fetch(path)).status)),
        [
          `${cachedCover}&exp=2&sig=two`,
          '/api/v1/img?u=busy&w=360',
          '/api/v1/img?u=forbidden&w=360',
          '/api/v1/img?u=chapter-page',
        ],
      );
      assert.deepEqual(statuses, [200, 429, 403, 429]);
      assert.equal(requests.get('recovering').length, 2);
      assert.equal(requests.get('busy').length, 2);
      assert.equal(requests.get('forbidden').length, 1);
      assert.equal(requests.get('chapter-page').length, 1);
    } finally {
      await browser?.close();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
