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
        response.end(pathname === '/sw.js' ? `${content}\n// test version ${version}` : content);
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      let browser;
      try {
        browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${server.address().port}/harness`);
        await page.evaluate(async () => {
          await globalThis.navigator.serviceWorker.register('/sw.js');
          await globalThis.navigator.serviceWorker.ready;
        });
        await page.waitForFunction(() => globalThis.navigator.serviceWorker.controller !== null);
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
