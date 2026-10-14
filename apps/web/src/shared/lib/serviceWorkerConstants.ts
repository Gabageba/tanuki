/** Общее у страницы и service worker. Отдельный файл — его читает и сам воркер, которому остальной
 *  `serviceWorker.ts` (window, DOM) недоступен. */

/** Сообщение UI → воркер: применить ожидающее обновление. */
export const SKIP_WAITING_MESSAGE = 'skipWaiting';

/** Кеш ответов API для работы без сети. Привязан к сессии: при выходе его чистит страница. */
export const API_CACHE_NAME = 'tanuki-api';
