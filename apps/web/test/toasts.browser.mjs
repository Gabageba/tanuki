import assert from 'node:assert/strict';
import { URL } from 'node:url';
import { test } from 'node:test';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const HARNESS = `<!doctype html><html><head></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useQueryClient } from '@tanstack/react-query';
import '/src/app/Providers/styles.ts';
import QueryClientProvider from '/src/app/Providers/QueryClientProvider.tsx';
import MantineProvider from '/src/app/Providers/MantineProvider/index.tsx';
import I18nProvider from '/src/app/Providers/I18nProvider.tsx';
import AppToastHost from '/src/app/Toasts/AppToastHost.tsx';
import useRemoveTitleBookmark from '/src/features/bookmark/hooks/useRemoveTitleBookmark.tsx';
import useHideFromContinueReading from '/src/pages/Home/hooks/useHideFromContinueReading.tsx';
import { Toasts } from '/src/shared/lib/toasts/store.ts';
import { TOAST_KIND, TOAST_PAUSE } from '/src/shared/lib/toasts/models.ts';
import { ApiRequestError } from '/src/shared/api/client.ts';
import { API_ERROR_CODE, NOTIFICATION_TYPE } from '@tanuki/contracts';
import { CURRENT_USER } from '/src/shared/storybook/fixtures.ts';
import { NOTIFICATIONS } from '/src/shared/storybook/account.ts';
import { showNotificationToast, reconcileNotificationToasts } from '/src/entities/notification/toasts.ts';
import { showPwaOffer } from '/src/features/pwa/toasts.tsx';
import { PWA_OFFER } from '/src/features/pwa/models.ts';
import { I18N } from '/src/shared/lib/i18n.ts';
function Probe() {
  const client = useQueryClient();
  const remove = useRemoveTitleBookmark('READMANGA:test');
  const hide = useHideFromContinueReading();
  React.useLayoutEffect(() => {
    globalThis.window.harness = { client, remove, hide, Toasts, TOAST_KIND, TOAST_PAUSE, ApiRequestError,
      API_ERROR_CODE, CURRENT_USER, NOTIFICATIONS, NOTIFICATION_TYPE, showNotificationToast,
      reconcileNotificationToasts, showPwaOffer, PWA_OFFER, I18N };
  });
  return null;
}
createRoot(document.getElementById('root')).render(React.createElement(I18nProvider, null,
  React.createElement(QueryClientProvider, null, React.createElement(MantineProvider, null,
    React.createElement(AppToastHost), React.createElement(Probe)))));
</script></body></html>`;

test(
  'рабочие ошибки, отмены, SSE и PWA проходят через общий хост',
  { timeout: 60_000 },
  async (t) => {
    const server = await createServer({
      root: new URL('..', import.meta.url).pathname,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 5189 },
      plugins: [
        {
          name: 'toast-test-harness',
          configureServer(vite) {
            vite.middlewares.use('/toast-test', async (_request, response) => {
              response.setHeader('Content-Type', 'text/html');
              response.end(await vite.transformIndexHtml('/toast-test', HARNESS));
            });
          },
        },
      ],
    });
    let browser;
    try {
      await server.listen();
      browser = await chromium.launch();
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      let restores = 0;
      let pages = 0;
      await page.route('**/api/v1/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (
          path === '/api/v1/bookmarks/restore' ||
          (path.endsWith('/progress/hidden') && route.request().method() === 'DELETE')
        ) {
          restores++;
          await route.fulfill({
            status: 500,
            json: { error: { code: 'internal', message: 'Ошибка восстановления' } },
          });
        } else if (path.endsWith('/bookmark')) {
          await route.fulfill({
            json: { rows: [{ titleId: 'READMANGA:test', folderId: 'folder' }] },
          });
        } else if (path === '/api/v1/notifications') {
          pages++;
          const p = Number(new URL(route.request().url()).searchParams.get('page'));
          await route.fulfill({
            json: { items: p === 1 ? [{ id: 'other' }] : [], total: 1, page: p },
          });
        } else await route.fulfill({ status: 204 });
      });
      await page.goto(`${server.resolvedUrls.local[0]}toast-test`);
      await page.waitForFunction(() => globalThis.window.harness !== undefined);
      await page.evaluate(() => globalThis.window.harness.I18N.changeLanguage('ru'));
      const cards = page.locator('[data-toast-id]');
      const reset = async () =>
        page.evaluate(() => {
          globalThis.window.harness.Toasts.reset();
          globalThis.window.harness.Toasts.setReader(false);
        });
      const readErrors = async (entries) =>
        page.evaluate(async (entries) => {
          const h = globalThis.window.harness;
          await Promise.all(
            entries.map(({ id, status = 0, code = h.API_ERROR_CODE.INTERNAL, path, meta }) =>
              h.client
                .fetchQuery({
                  queryKey: ['toast-test', id],
                  retry: false,
                  meta,
                  queryFn: () => Promise.reject(new h.ApiRequestError('Сбой', code, status, path)),
                })
                .catch(() => undefined),
            ),
          );
        }, entries);

      await t.test(
        'общий сбой чтений объединяется, разные источники и операции независимы',
        async () => {
          await readErrors([{ id: 'one' }, { id: 'two' }]);
          await expect(cards).toHaveCount(1);
          await reset();
          await readErrors([
            { id: 'a', status: 503, code: 'sourceUnavailable', path: '/sources/A/titles' },
            { id: 'b', status: 503, code: 'sourceUnavailable', path: '/sources/B/titles' },
          ]);
          await expect(cards).toHaveCount(2);
          await reset();
          await page.evaluate(async () => {
            const h = globalThis.window.harness;
            await Promise.all(
              ['one', 'two'].map((id) =>
                h.client
                  .getMutationCache()
                  .build(h.client, {
                    mutationFn: () =>
                      Promise.reject(new h.ApiRequestError('Сбой', h.API_ERROR_CODE.INTERNAL, 500)),
                  })
                  .execute({ id })
                  .catch(() => undefined),
              ),
            );
          });
          await expect(cards).toHaveCount(2);
        },
      );

      await t.test(
        'формы, следующая страница, закрытый источник, 18+ и отмена запроса молчат',
        async () => {
          await reset();
          await readErrors([
            { id: 'silent', meta: { silentError: true } },
            { id: 'locked', status: 403, code: 'sourceAccountRequired' },
            { id: 'adult', status: 403, code: 'adultContentHidden' },
          ]);
          await page.evaluate(async () => {
            const h = globalThis.window.harness;
            const query = h.client.getQueryCache().build(h.client, {
              queryKey: ['next-page'],
              retry: false,
              meta: { silentNextPageError: true },
              queryFn: () => Promise.reject(new Error('failed')),
            });
            await query
              .fetch(undefined, { meta: { fetchMore: { direction: 'forward' } } })
              .catch(() => undefined);
            await h.client
              .fetchQuery({
                queryKey: ['abort'],
                retry: false,
                queryFn: () =>
                  Promise.reject(new globalThis.DOMException('cancelled', 'AbortError')),
              })
              .catch(() => undefined);
          });
          await expect(cards).toHaveCount(0);
        },
      );

      await t.test('переполнение скрывает верх стека до закрытия новых сообщений', async () => {
        await reset();
        await page.evaluate(() => {
          const h = globalThis.window.harness;
          for (let index = 1; index <= 5; index++) {
            const id = h.Toasts.show({
              id: 'overflow-' + index,
              title: 'Сообщение ' + index,
              kind: h.TOAST_KIND.UNDO,
            });
            h.Toasts.pause(id, h.TOAST_PAUSE.HOVER, true);
          }
        });
        await expect(cards).toHaveCount(3);
        await expect(page.locator('[data-toast-id="overflow-1"]')).toHaveCount(0);
        await expect(page.locator('[data-toast-id="overflow-2"]')).toHaveCount(0);
        await page.locator('[data-toast-id="overflow-5"] button').click();
        await expect(page.locator('[data-toast-id="overflow-2"]')).toBeVisible();
        await expect(page.locator('[data-toast-id="overflow-1"]')).toHaveCount(0);
        await page.locator('[data-toast-id="overflow-4"] button').click();
        await expect(page.locator('[data-toast-id="overflow-1"]')).toBeVisible();
        await expect(cards).toHaveCount(3);
        await reset();
      });

      await t.test('сбой без сети не показывает тост', async () => {
        await page.context().setOffline(true);
        await readErrors([{ id: 'offline' }]);
        await expect(cards).toHaveCount(0);
        await page.context().setOffline(false);
      });

      await t.test('несколько 401 дают один выход и одно сообщение уже гостю', async () => {
        await page.evaluate(() => {
          const h = globalThis.window.harness;
          h.client.setQueryData(['auth', 'me'], h.CURRENT_USER);
        });
        await readErrors([
          { id: '401a', status: 401, code: 'unauthorized' },
          { id: '401b', status: 401, code: 'unauthorized' },
        ]);
        await expect(cards).toHaveCount(1);
        assert.equal(
          await page.evaluate(() => globalThis.window.harness.client.getQueryData(['auth', 'me'])),
          null,
        );
        await expect(cards.first()).toContainText('Сессия истекла, войдите снова');
      });

      await t.test(
        'поздний 401 прежней сессии не выходит из нового аккаунта и не показывает его ошибку',
        async () => {
          await reset();
          await page.evaluate(() => {
            const h = globalThis.window.harness;
            h.client.setQueryData(['auth', 'me'], h.CURRENT_USER);
            globalThis.window.oldMutation = h.client
              .getMutationCache()
              .build(h.client, {
                mutationFn: () =>
                  new Promise((_resolve, reject) => {
                    globalThis.window.rejectOldMutation = reject;
                  }),
              })
              .execute()
              .catch(() => undefined);
          });
          await page.waitForFunction(() => globalThis.window.rejectOldMutation !== undefined);
          await page.evaluate(async () => {
            const h = globalThis.window.harness;
            h.client.setQueryData(['auth', 'me'], null);
            h.client.setQueryData(['auth', 'me'], { ...h.CURRENT_USER, id: 'next-user' });
            globalThis.window.rejectOldMutation(
              new h.ApiRequestError('expired', h.API_ERROR_CODE.UNAUTHORIZED, 401),
            );
            await globalThis.window.oldMutation;
          });
          await expect(cards).toHaveCount(0);
          assert.equal(
            await page.evaluate(
              () => globalThis.window.harness.client.getQueryData(['auth', 'me']).id,
            ),
            'next-user',
          );
        },
      );

      await t.test(
        'возврат закладки закрывает исходный тост и даёт ровно одну ошибку',
        async () => {
          await reset();
          await page.evaluate(async () => globalThis.window.harness.remove.mutateAsync());
          await expect(page.getByRole('button', { name: 'Вернуть закладку' })).toBeVisible();
          await page.getByRole('button', { name: 'Вернуть закладку' }).click();
          await expect(cards).toHaveCount(1);
          await expect(page.getByRole('button', { name: 'Вернуть закладку' })).toHaveCount(0);
          await expect(cards.first()).toContainText('Ошибка восстановления');
          assert.equal(restores, 1);
        },
      );

      await t.test('возврат карточки главной также не дублирует ошибку', async () => {
        await reset();
        await page.evaluate(async () =>
          globalThis.window.harness.hide.mutateAsync('READMANGA:test'),
        );
        await page.getByRole('button', { name: 'Вернуть тайтл' }).click();
        await expect(cards).toHaveCount(1);
        await expect(cards.first()).toContainText('Ошибка восстановления');
        assert.equal(restores, 2);
      });

      await t.test(
        'события читалки ждут, безопасность показывается сразу; пакетное удаление сверяет ленту',
        async () => {
          await reset();
          await page.evaluate(() => {
            const h = globalThis.window.harness;
            h.Toasts.setReader(true);
            const source = h.NOTIFICATIONS.find(
              (item) => item.type === h.NOTIFICATION_TYPE.SOURCE_DOWN,
            );
            const security = h.NOTIFICATIONS.find(
              (item) => item.type === h.NOTIFICATION_TYPE.EMAIL_CHANGED,
            );
            h.showNotificationToast({ item: source, t: h.I18N.t, onOpen: () => undefined });
            h.showNotificationToast({ item: security, t: h.I18N.t, onOpen: () => undefined });
          });
          await expect(cards).toHaveCount(1);
          await page.evaluate(() => globalThis.window.harness.Toasts.setReader(false));
          await expect(cards).toHaveCount(2);
          await page.evaluate(async () => globalThis.window.harness.reconcileNotificationToasts());
          await expect(cards).toHaveCount(0);
          assert.equal(pages, 1);
        },
      );

      await t.test(
        'вытеснение PWA не равно отказу; смена аккаунта убирает старые действия',
        async () => {
          await page.evaluate(() => {
            const h = globalThis.window.harness;
            globalThis.window.dismissed = 0;
            h.showPwaOffer({
              offer: h.PWA_OFFER.UPDATE,
              t: h.I18N.t,
              onConfirm: () => undefined,
              onDismiss: () => globalThis.window.dismissed++,
            });
            for (let i = 0; i < 3; i++)
              h.Toasts.show({ title: 'Отмена ' + i, kind: h.TOAST_KIND.UNDO });
          });
          await expect(cards).toHaveCount(3);
          await expect(page.getByRole('button', { name: 'Обновить приложение' })).toHaveCount(0);
          assert.equal(await page.evaluate(() => globalThis.window.dismissed), 0);
          await page.evaluate(() => {
            const h = globalThis.window.harness;
            h.client.setQueryData(['auth', 'me'], h.CURRENT_USER);
          });
          await expect(cards).toHaveCount(1);
          await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
          assert.equal(await page.evaluate(() => globalThis.window.dismissed), 1);
        },
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      await server.close();
    }
  },
);
