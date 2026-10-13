/**
 * `meta` запроса или мутации, которое читает глобальный обработчик ошибок в QueryClientProvider.
 * - `silentError` — ошибку разбирает сам вызывающий код (форма раскладывает её по полям),
 *   уведомление не нужно;
 * - `silentNextPageError` — молчать только про следующую порцию бесконечного списка: её сбой
 *   показывает строка подгрузки (`PageLayout.InfiniteScrollTrigger`), а первая порция — как обычно;
 * - `errorTitle` — заголовок уведомления, если текста с сервера без контекста мало.
 */
export type ErrorMeta = {
  silentError?: boolean;
  silentNextPageError?: boolean;
  errorTitle?: string;
};

export const SILENT_ERROR_META = { silentError: true } satisfies ErrorMeta;

export const SILENT_NEXT_PAGE_ERROR_META = { silentNextPageError: true } satisfies ErrorMeta;

export const readErrorMeta = (meta: Record<string, unknown> | undefined): ErrorMeta => ({
  silentError: meta?.silentError === true,
  silentNextPageError: meta?.silentNextPageError === true,
  errorTitle: typeof meta?.errorTitle === 'string' ? meta.errorTitle : undefined,
});
