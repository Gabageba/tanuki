/// <reference lib="webworker" />
import { DOWNLOAD_MESSAGE, type DownloadMessage } from '../entities/download/models';
import { PREPARE_UPDATE_MESSAGE, SKIP_WAITING_MESSAGE } from '../shared/lib/serviceWorkerConstants';
import { registerCaching } from './caching';
import { abortChapterDownload, prepareForUpdate, processQueue } from './downloader';

declare const self: ServiceWorkerGlobalScope;

/** Форма сообщения push, которую шлёт API (`PushMessage`). */
type PushPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
};

// Первая установка активируется сама; обновление ждёт явного SKIP_WAITING_MESSAGE из UI.
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

registerCaching();

const isDownloadMessage = (data: unknown): data is DownloadMessage =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  'userId' in data &&
  (data.type === DOWNLOAD_MESSAGE.PROCESS || data.type === DOWNLOAD_MESSAGE.ABORT);

/** Подготовкой владеет ожидающий воркер: закрытие вкладки не прерывает обновление.
 * Старый активный воркер без протокола не отвечает; его очередь продолжится после активации. */
const prepareActiveWorker = () =>
  new Promise<void>((resolve) => {
    const active = self.registration.active;
    if (!active) return resolve();
    const channel = new MessageChannel();
    const finish = () => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve();
    };
    const timeout = setTimeout(finish, 1000);
    channel.port1.onmessage = (event: MessageEvent<boolean>) => {
      clearTimeout(timeout);
      if (event.data) finish();
    };
    try {
      active.postMessage(PREPARE_UPDATE_MESSAGE, [channel.port2]);
    } catch {
      channel.port2.close();
      finish();
    }
  });

self.addEventListener('message', (event) => {
  if (event.data === PREPARE_UPDATE_MESSAGE) {
    const port = event.ports[0];
    port?.postMessage(false);
    event.waitUntil(prepareForUpdate().then(() => port?.postMessage(true)));
    return;
  }
  if (event.data === SKIP_WAITING_MESSAGE) {
    event.waitUntil(prepareActiveWorker().then(() => self.skipWaiting()));
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
