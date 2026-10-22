/// <reference lib="webworker" />
import { DOWNLOAD_MESSAGE, type DownloadMessage } from '../entities/download/models';
import { SKIP_WAITING_MESSAGE } from '../shared/lib/serviceWorkerConstants';
import { registerCaching } from './caching';
import { abortChapterDownload, processQueue } from './downloader';

declare const self: ServiceWorkerGlobalScope;

/** Форма сообщения push, которую шлёт API (`PushMessage`). */
type PushPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
};

// По задумке новая версия не активируется сама (registerType: 'prompt', docs/06): её применяет
// пользователь тостом. Пока тоста нет, воркер обновляется сразу — иначе он навсегда застрял бы в
// waiting, пока не закрыты все вкладки и окно PWA.
self.addEventListener('install', () => void self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

registerCaching();

const isDownloadMessage = (data: unknown): data is DownloadMessage =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  'userId' in data &&
  (data.type === DOWNLOAD_MESSAGE.PROCESS || data.type === DOWNLOAD_MESSAGE.ABORT);

self.addEventListener('message', (event) => {
  if (event.data === SKIP_WAITING_MESSAGE) {
    void self.skipWaiting();
    return;
  }
  if (!isDownloadMessage(event.data)) return;

  const { type, userId, chapterId } = event.data;
  if (type === DOWNLOAD_MESSAGE.ABORT && chapterId) {
    abortChapterDownload(userId, chapterId);
    return;
  }
  // Пока очередь идёт, воркер жив: событие ждёт её конца. Пульс страницы продлевает это ожидание.
  event.waitUntil(processQueue(userId));
});

/** WebKit на iOS отзывает подписку, если на push не показать уведомление, — там показываем всегда. */
const IS_IOS = /iPad|iPhone|iPod/.test(self.navigator.userAgent);

const parsePayload = (data: PushMessageData | null): PushPayload | null => {
  try {
    return data ? (data.json() as PushPayload) : null;
  } catch {
    return null;
  }
};

self.addEventListener('push', (event) => {
  const payload = parsePayload(event.data);
  if (!payload) return;

  event.waitUntil(
    (async () => {
      // Приложение открыто и видимо: то же событие уже пришло по SSE бейджем и тостом.
      if (!IS_IOS) {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (windows.some((client) => client.visibilityState === 'visible')) return;
      }

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/icon-192.png',
        data: { url: payload.url },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data as { url?: string } | null)?.url ?? '/',
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      // `navigate()` работает только у окна под этим воркером (после Shift+Reload вкладка не под ним).
      const [existing] = await self.clients.matchAll({ type: 'window' });
      if (existing) {
        try {
          await (await existing.focus()).navigate(url);
          return;
        } catch {
          // окно не дало себя увести — откроем новое
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
