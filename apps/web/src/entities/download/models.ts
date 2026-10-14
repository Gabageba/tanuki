import type {
  Chapter,
  ChapterNumbering,
  ChaptersResponse,
  EnumLiteralsOf,
  Page,
  TitleDetailsResponse,
} from '@tanuki/contracts';

/** Нет записи в `downloads` — глава не скачана. Переходы — в docs/plans/offline-downloads.md. */
export const DOWNLOAD_STATUS = {
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  DONE: 'done',
  FAILED: 'failed',
} as const;
export type DownloadStatus = EnumLiteralsOf<typeof DOWNLOAD_STATUS>;

export const DOWNLOAD_ERROR = {
  /** Повторы исчерпаны при живой сети. */
  NETWORK: 'network',
  /** Источник ответил ошибкой на /pages или на страницу. */
  SOURCE: 'source',
  /** QuotaExceededError — очередь заодно встаёт на паузу. */
  QUOTA: 'quota',
} as const;
export type DownloadError = EnumLiteralsOf<typeof DOWNLOAD_ERROR>;

/** Сообщения UI → service worker. Состояние очереди живёт в Dexie: обратно воркер ничего не шлёт,
 *  UI видит его записи через liveQuery. */
export const DOWNLOAD_MESSAGE = {
  /** Пройти очередь пользователя; повторный, пока она идёт, ничего не делает. Его же страница
   *  шлёт пульсом — событие продлевает жизнь воркера. */
  PROCESS: 'downloadsProcess',
  /** Оборвать текущую главу: её отменили или удалили. */
  ABORT: 'downloadsAbort',
} as const;
export type DownloadMessageType = EnumLiteralsOf<typeof DOWNLOAD_MESSAGE>;

export type DownloadMessage = {
  type: DownloadMessageType;
  userId: string;
  chapterId?: string;
};

/** Кеш скачанного: страницы и обложки по синтетическим ключам, без вытеснения — чистится только
 *  явным действием. «Очистить кеш браузера» его не трогает. */
export const OFFLINE_CACHE_NAME = 'tanuki-offline-v1';

/** Префикс синтетических ключей кеша скачанного; адреса с ним отдаёт service worker. */
export const OFFLINE_PATH_PREFIX = '/offline/';

/** Заголовок запросов, которые service worker делает для скачивания. */
export const OFFLINE_REQUEST_HEADER = 'X-Tanuki-Offline';

/** Запись очереди и скачанного — одна на главу. */
export type DownloadRow = {
  chapterId: string;
  titleId: string;
  branchId: string;
  status: DownloadStatus;
  error?: DownloadError;
  /** Порядок в очереди: меньше — раньше. */
  order: number;
  pagesDone: number;
  pagesTotal: number;
  bytes: number;
  createdAt: string;
  doneAt?: string;
};

/** Снимок главы на момент скачивания: по нему читалка собирает страницы без сети. Адреса `pages`
 *  подписаны и устаревают за час — читалка берёт из них только размеры. */
export type ChapterSnapshotRow = {
  chapterId: string;
  titleId: string;
  chapter: Chapter;
  numbering: ChapterNumbering;
  pages: Page[];
  prevChapterId: string | null;
  nextChapterId: string | null;
};

/** Снимок тайтла, у которого что-то скачано или стоит в очереди: страница тайтла, «Загрузки»,
 *  каталог и поиск без сети. Списки глав — по запросу ветки (`DEFAULT_CHAPTERS_LIST_KEY` — ветка
 *  по умолчанию), чтобы без сети список показывал и не скачанные главы. */
export type TitleSnapshotRow = {
  titleId: string;
  sourceId: string;
  details: TitleDetailsResponse;
  chapterLists: Record<string, ChaptersResponse>;
  /** Обложка в кеше скачанного; null — сохранить её не удалось. */
  coverKey: string | null;
  createdAt: string;
};

/** Ключ списка глав ветки по умолчанию (запрос без `branch`). */
export const DEFAULT_CHAPTERS_LIST_KEY = '';

export const QUEUE_STATE_ID = 'state';

export type QueueStateRow = {
  id: typeof QUEUE_STATE_ID;
  isPaused: boolean;
};

/** Отметка прогресса, которую не удалось отправить без сети: одна на тайтл, последняя побеждает. */
export type PendingProgressRow = {
  titleId: string;
  chapterId: string;
  pageIndex: number;
  chapter?: Chapter;
  savedAt: string;
};

export const DOWNLOAD_SETTINGS_ID = 'settings';

/** Настройки «Загрузок» — живут на устройстве, на сервер не уходят. */
export type DownloadSettingsRow = {
  id: typeof DOWNLOAD_SETTINGS_ID;
  /** Папки закладок, новые главы тайтлов из которых встают в очередь; пусто — выключено. */
  autoDownloadFolderIds: string[];
  isAutoDeleteEnabled: boolean;
};

export const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettingsRow = {
  id: DOWNLOAD_SETTINGS_ID,
  autoDownloadFolderIds: [],
  isAutoDeleteEnabled: false,
};

/** Глава, удалённая авто-удалением: авто-скачивание повторно её не ставит. */
export type SkippedChapterRow = {
  chapterId: string;
};

/** Попытки одной страницы и паузы между ними. */
export const PAGE_RETRY_DELAYS_MS = [1000, 3000, 9000];
