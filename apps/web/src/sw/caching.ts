/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import type { WorkboxPlugin } from 'workbox-core';
import { OFFLINE_CACHE_NAME, OFFLINE_PATH_PREFIX } from '../entities/download/models';
import { API_CACHE_NAME } from '../shared/lib/serviceWorkerConstants';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0];
};

const DAY_SECONDS = 24 * 60 * 60;

/**
 * Запросы API, ответы которых нужны без сети: страница тайтла, закладки, главная, настройки.
 * NetworkFirst, а не StaleWhileRevalidate: после мутации повторный запрос получил бы из кеша
 * старый ответ, и «Продолжить чтение» показывала бы прошлую отметку. Не кешируются поток SSE,
 * подписанные `/pages`, каталог и поиск (без сети их заменяет скачанное) и `/auth`.
 */
const CACHED_API_PATH =
  /^\/api\/v1\/(sources(\/count|\/[^/]+)?|titles\/[^/]+(\/(chapters|progress|bookmark|matches))?|bookmarks(\/new-chapters)?|bookmark-folders|reading-progress\/recent|user-settings|reader-settings|selections\/[^/]+|users\/me|notifications\/push\/config)$/;

/** Подпись `/img` (`exp`, `sig`) меняется на каждом ответе — ключ кеша картинки без неё, иначе
 *  повторный показ той же обложки никогда не попадал бы в кеш. */
const STRIP_SIGNATURE_PLUGIN: WorkboxPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const url = new URL(request.url);
    url.searchParams.delete('exp');
    url.searchParams.delete('sig');
    return url.href;
  },
};

const isImageRequest = (url: URL) => url.pathname === '/api/v1/img';
/** Обложки запрашиваются с шириной или форматом, страницы глав — без них. */
const isCoverRequest = (url: URL) => url.searchParams.has('w') || url.searchParams.has('f');

export const registerCaching = () => {
  // App shell: ревизии из манифеста сборки. В dev манифест пустой — офлайн проверяется сборкой.
  const manifest = self.__WB_MANIFEST ?? [];
  precacheAndRoute(manifest);
  cleanupOutdatedCaches();
  if (manifest.some((entry) => (typeof entry === 'string' ? entry : entry.url) === 'index.html')) {
    registerRoute(
      new NavigationRoute(createHandlerBoundToURL('index.html'), {
        denylist: [/^\/api\//, new RegExp(`^${OFFLINE_PATH_PREFIX}`)],
      }),
    );
  }

  // Скачанные страницы и обложки: только из кеша скачанного, без сети и без вытеснения.
  registerRoute(
    ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith(OFFLINE_PATH_PREFIX),
    async ({ url }) => {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      return (await cache.match(url.pathname)) ?? new Response(null, { status: 404 });
    },
  );

  registerRoute(
    ({ url, sameOrigin }) => sameOrigin && CACHED_API_PATH.test(url.pathname),
    new NetworkFirst({
      cacheName: API_CACHE_NAME,
      networkTimeoutSeconds: 10,
      plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * DAY_SECONDS })],
    }),
  );

  registerRoute(
    ({ url, sameOrigin }) => sameOrigin && isImageRequest(url) && isCoverRequest(url),
    new CacheFirst({
      cacheName: 'tanuki-covers',
      plugins: [
        STRIP_SIGNATURE_PLUGIN,
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 30 * DAY_SECONDS,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  );

  // Страницы при онлайн-чтении — обычный кеш, который браузер вправе вытеснить; скачанное живёт
  // отдельно, в OFFLINE_CACHE_NAME.
  registerRoute(
    ({ url, sameOrigin }) => sameOrigin && isImageRequest(url) && !isCoverRequest(url),
    new CacheFirst({
      cacheName: 'tanuki-pages',
      plugins: [
        STRIP_SIGNATURE_PLUGIN,
        new ExpirationPlugin({
          maxEntries: 400,
          maxAgeSeconds: 7 * DAY_SECONDS,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  );
};
