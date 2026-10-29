import { delay, http, HttpResponse } from 'msw';
import {
  API_ERROR_CODE,
  DEFAULT_READER_SETTINGS,
  SEARCH_GROUP_STATUS,
  type ApiErrorCode,
  type BookmarksLookupResponse,
  type FiltersResponse,
  type PushConfig,
  type RemoveTitleBookmarkResponse,
  SEARCH_STREAM_EVENT,
  type SearchGroup,
  type SelectionsSectionResponse,
  type TitleBookmark,
  type TitleBookmarkVisitResponse,
} from '@tanuki/contracts';
import {
  BACKUP,
  BACKUP_PREVIEW,
  BACKUP_RESTORE_RESULT,
  BOOKMARKS_RESPONSE,
  INVITES_RESPONSE,
  MANAGED_USERS_RESPONSE,
  NEW_CHAPTER_BOOKMARKS_RESPONSE,
  NOTIFICATIONS_PAGE,
  PROFILE_STATISTICS_RESPONSE,
  SESSIONS_RESPONSE,
  SOURCE_IMPORT_PREVIEW,
  SOURCE_IMPORT_RESULT,
  USER_SETTINGS,
} from './account';
import {
  BOOKMARK_FOLDERS_RESPONSE,
  CREATED_INVITE,
  CURRENT_USER,
  FILTER_GROUPS,
  FOLDER_ID,
  SOURCE_ACCOUNTS_RESPONSE,
  SOURCES,
  SOURCES_RESPONSE,
} from './fixtures';
import { renderCoverSvg, renderPageSvg } from './images';
import {
  CATALOG_RESPONSE,
  CHAPTERS_RESPONSE,
  CONTINUE_READING_RESPONSE,
  getPagesResponse,
  getSelectionsResponse,
  READING_PROGRESS_RESPONSE,
  SEARCH_HISTORY_RESPONSE,
  SEARCH_GROUPS,
  TITLE_DETAILS_RESPONSE,
  TITLE_MATCHES_RESPONSE,
  TITLES,
} from './titles';

const API = '/api/v1';

/** Путь API в виде, понятном MSW: `apiPath('/auth/me')` → `/api/v1/auth/me`. */
export const apiPath = (path: string) => `${API}${path}`;

/** Ответ-ошибка в формате API (`ApiError`) — для историй про ошибки форм и экранов. */
export const apiError = (code: ApiErrorCode, message: string, status = 400) =>
  HttpResponse.json({ error: { code, message } }, { status });

/** Запрос, который не отвечает, — для историй с загрузкой. */
export const neverResolve = async () => {
  await delay('infinite');
  return new HttpResponse(null);
};

/** Все запросы API висят — страница остаётся в загрузке, видны скелетоны. Текущий
 *  пользователь отвечает, иначе вместо страницы был бы экран входа. */
export const LOADING_HANDLERS = [
  http.get(apiPath('/auth/me'), () => HttpResponse.json(CURRENT_USER)),
  http.get(apiPath('/*'), neverResolve),
];

/** Все запросы API падают с 500 — экраны ошибок и пустые состояния блоков. */
export const ERROR_HANDLERS = [
  http.get(apiPath('/auth/me'), () => HttpResponse.json(CURRENT_USER)),
  http.get(apiPath('/*'), () => apiError(API_ERROR_CODE.INTERNAL, 'Сервер не ответил', 500)),
];

/** Нет сети: запросы API рвутся, как у браузера без соединения, — данные приходят из снимков
 *  скачанного. Текущий пользователь отвечает (без сети его даёт кеш воркера), картинки отдаёт
 *  обработчик по умолчанию — обложки скачанного без сети берутся из кеша. В паре с `goOffline`. */
export const OFFLINE_HANDLERS = [
  http.get(apiPath('/auth/me'), () => HttpResponse.json(CURRENT_USER)),
  http.all(apiPath('/*'), ({ request }) =>
    new URL(request.url).pathname === apiPath('/img') ? undefined : HttpResponse.error(),
  ),
];

type SearchStreamOptions = {
  /** Источники, которые так и не отвечают: их места остаются скелетоном, `done` не приходит. */
  pendingIds?: string[];
  /** Пауза перед каждой группой — как ответы источников по очереди. */
  delayMs?: number;
};

/** Поток `GET /search` (SSE): места, группы по одной, `done` — если ответили все. */
export const searchStream = (
  groups: SearchGroup[],
  { pendingIds = [], delayMs = 0 }: SearchStreamOptions = {},
) => {
  const encoder = new TextEncoder();
  const frame = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const stream = new ReadableStream({
    async start(controller) {
      const sourceIds = [...groups.map(({ sourceId }) => sourceId), ...pendingIds];
      controller.enqueue(frame(SEARCH_STREAM_EVENT.SOURCES, { sourceIds }));
      for (const group of groups) {
        if (delayMs) await delay(delayMs);
        controller.enqueue(frame(SEARCH_STREAM_EVENT.GROUP, group));
      }
      if (pendingIds.length) return;
      controller.enqueue(frame(SEARCH_STREAM_EVENT.DONE, {}));
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { 'content-type': 'text/event-stream' } });
};

const svg = (body: string) =>
  new HttpResponse(body, { headers: { 'content-type': 'image/svg+xml' } });

/**
 * Ответы API по умолчанию для всех историй. Чтения отдают данные из fixtures, изменения ничего не
 * делают и отвечают успехом — истории только смотрят, на бэкенд ничего не уходит. Своя история
 * перекрывает их через `parameters.msw`. Порядок важен: точные пути — раньше путей с параметром.
 */
export const DEFAULT_HANDLERS = [
  http.get(apiPath('/img'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const chapter = params.get('chapter');
    return chapter
      ? svg(renderPageSvg(chapter, Number(params.get('page'))))
      : svg(renderCoverSvg(params.get('cover') ?? ''));
  }),

  // Аккаунт
  http.get(apiPath('/auth/me'), () => HttpResponse.json(CURRENT_USER)),
  http.get(apiPath('/auth/invites/:code'), () => HttpResponse.json({ valid: true })),
  http.get(apiPath('/auth/check-username'), () => HttpResponse.json({ available: true })),
  http.get(apiPath('/user-settings'), () => HttpResponse.json(USER_SETTINGS)),
  http.put(apiPath('/user-settings'), async ({ request }) =>
    HttpResponse.json({ ...USER_SETTINGS, ...((await request.json()) as object) }),
  ),
  http.get(apiPath('/users/me/statistics'), () => HttpResponse.json(PROFILE_STATISTICS_RESPONSE)),
  http.get(apiPath('/account/sessions'), () => HttpResponse.json(SESSIONS_RESPONSE)),
  http.get(apiPath('/reader-settings'), () => HttpResponse.json(DEFAULT_READER_SETTINGS)),
  http.all(apiPath('/users/me'), () => HttpResponse.json(CURRENT_USER)),
  http.all(apiPath('/users/me/avatar'), () => HttpResponse.json(CURRENT_USER)),
  http.post(apiPath('/account/email/confirm'), () => HttpResponse.json(CURRENT_USER)),

  // Источники
  http.get(apiPath('/sources'), () => HttpResponse.json(SOURCES_RESPONSE)),
  http.get(apiPath('/sources/count'), () => HttpResponse.json({ count: SOURCES.length })),
  http.get(apiPath('/sources/:sourceId/titles'), () => HttpResponse.json(CATALOG_RESPONSE)),
  http.get(apiPath('/sources/:sourceId/filters'), () =>
    HttpResponse.json({ groups: FILTER_GROUPS } satisfies FiltersResponse),
  ),
  http.get(apiPath('/sources/:sourceId'), ({ params }) =>
    HttpResponse.json(SOURCES.find(({ id }) => id === params.sourceId) ?? SOURCES[0]),
  ),
  http.post(apiPath('/sources/:sourceId/probe'), ({ params }) =>
    HttpResponse.json(SOURCES.find(({ id }) => id === params.sourceId) ?? SOURCES[0]),
  ),
  http.get(apiPath('/source-accounts'), () => HttpResponse.json(SOURCE_ACCOUNTS_RESPONSE)),
  // Вход в LibSocial: MangaLib просит код из письма, с кодом или пропуском вход завершается.
  http.post(apiPath('/source-accounts/libsocial/login'), () =>
    HttpResponse.json({ pendingSourceId: 'mangalib' }),
  ),
  http.post(apiPath('/source-accounts/libsocial/login/*'), () =>
    HttpResponse.json({ pendingSourceId: null }),
  ),

  // Тайтлы
  http.get(apiPath('/titles/:titleId'), () => HttpResponse.json(TITLE_DETAILS_RESPONSE)),
  http.get(apiPath('/titles/:titleId/chapters'), () => HttpResponse.json(CHAPTERS_RESPONSE)),
  http.get(apiPath('/titles/:titleId/chapters/:chapterId/pages'), ({ params }) =>
    HttpResponse.json(getPagesResponse(String(params.chapterId))),
  ),
  http.get(apiPath('/titles/:titleId/progress'), () =>
    HttpResponse.json(READING_PROGRESS_RESPONSE),
  ),
  http.put(apiPath('/titles/:titleId/progress'), () =>
    HttpResponse.json(READING_PROGRESS_RESPONSE.own),
  ),
  http.get(apiPath('/titles/:titleId/matches'), () => HttpResponse.json(TITLE_MATCHES_RESPONSE)),
  http.get(apiPath('/titles/:titleId/bookmark'), () =>
    HttpResponse.json({ folderId: FOLDER_ID.READING, conflict: null } satisfies TitleBookmark),
  ),
  http.put(apiPath('/titles/:titleId/bookmark'), async ({ request }) =>
    HttpResponse.json({
      folderId: ((await request.json()) as { folderId: string }).folderId,
      conflict: null,
    } satisfies TitleBookmark),
  ),
  http.delete(apiPath('/titles/:titleId/bookmark'), () =>
    HttpResponse.json({ rows: [] } satisfies RemoveTitleBookmarkResponse),
  ),
  http.post(apiPath('/titles/:titleId/bookmark/visit'), () =>
    HttpResponse.json({
      newChapterIds: CHAPTERS_RESPONSE.items.slice(0, 2).map(({ id }) => id),
    } satisfies TitleBookmarkVisitResponse),
  ),
  http.get(apiPath('/reading-progress/recent'), () => HttpResponse.json(CONTINUE_READING_RESPONSE)),

  // Закладки
  http.get(apiPath('/bookmark-folders'), () => HttpResponse.json(BOOKMARK_FOLDERS_RESPONSE)),
  http.get(apiPath('/bookmarks'), () => HttpResponse.json(BOOKMARKS_RESPONSE)),
  http.get(apiPath('/bookmarks/new-chapters'), () =>
    HttpResponse.json(NEW_CHAPTER_BOOKMARKS_RESPONSE),
  ),
  http.post(apiPath('/bookmarks/lookup'), () =>
    HttpResponse.json(
      Object.fromEntries(
        TITLES.slice(0, 4).map(({ id }) => [id, FOLDER_ID.READING]),
      ) satisfies BookmarksLookupResponse,
    ),
  ),

  // Поиск и подборки
  http.get(apiPath('/search'), () => searchStream(SEARCH_GROUPS)),
  http.get(apiPath('/search/history'), () => HttpResponse.json(SEARCH_HISTORY_RESPONSE)),
  http.get(apiPath('/selections/:sourceId/:sectionId'), ({ params }) =>
    HttpResponse.json({
      sourceId: String(params.sourceId),
      sectionId: String(params.sectionId),
      status: SEARCH_GROUP_STATUS.OK,
      items: TITLES,
      hasNextPage: false,
    } satisfies SelectionsSectionResponse),
  ),
  http.get(apiPath('/selections/:sourceId'), ({ params }) =>
    HttpResponse.json(getSelectionsResponse(String(params.sourceId))),
  ),

  // Уведомления
  http.get(apiPath('/notifications'), () => HttpResponse.json(NOTIFICATIONS_PAGE)),
  http.get(apiPath('/notifications/unread-count'), () => HttpResponse.json({ count: 3 })),
  http.get(apiPath('/notifications/push/config'), () =>
    HttpResponse.json({ enabled: true, publicKey: 'BNbx-storybook-key' } satisfies PushConfig),
  ),
  // Поток SSE в историях не нужен: без него счётчик просто опрашивается.
  http.get(apiPath('/notifications/stream'), () => new HttpResponse(null, { status: 204 })),

  // Резервная копия
  http.get(apiPath('/backup'), () => HttpResponse.json(BACKUP)),
  http.post(apiPath('/backup/preview'), () => HttpResponse.json(BACKUP_PREVIEW)),
  http.post(apiPath('/backup/restore'), () => HttpResponse.json(BACKUP_RESTORE_RESULT)),
  http.post(apiPath('/source-import/preview'), () => HttpResponse.json(SOURCE_IMPORT_PREVIEW)),
  http.post(apiPath('/source-import'), () => HttpResponse.json(SOURCE_IMPORT_RESULT)),

  // Управление
  http.get(apiPath('/users'), () => HttpResponse.json(MANAGED_USERS_RESPONSE)),
  http.all(apiPath('/users/:id/*'), () => HttpResponse.json(MANAGED_USERS_RESPONSE.items[2])),
  http.get(apiPath('/invites'), () => HttpResponse.json(INVITES_RESPONSE)),
  http.post(apiPath('/invites'), () => HttpResponse.json(CREATED_INVITE)),
  http.post(apiPath('/invites/:id/reissue'), () => HttpResponse.json(CREATED_INVITE)),
  http.delete(apiPath('/invites/:id'), () => HttpResponse.json(INVITES_RESPONSE.items[4])),

  // Остальное: чтение без заглушки — 404, изменение — успех без тела.
  http.get(apiPath('/*'), () =>
    apiError(API_ERROR_CODE.NOT_FOUND, 'Нет заглушки в Storybook', 404),
  ),
  http.all(apiPath('/*'), () => new HttpResponse(null, { status: 204 })),
];
