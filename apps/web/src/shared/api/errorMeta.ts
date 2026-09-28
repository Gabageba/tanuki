/**
 * `meta` запроса или мутации, которое читает глобальный обработчик ошибок в QueryClientProvider.
 * - `silentError` — ошибку разбирает сам вызывающий код (форма раскладывает её по полям),
 *   уведомление не нужно;
 * - `errorTitle` — заголовок уведомления, если текста с сервера без контекста мало.
 */
export type ErrorMeta = {
  silentError?: boolean;
  errorTitle?: string;
};

export const SILENT_ERROR_META = { silentError: true } satisfies ErrorMeta;

export const readErrorMeta = (meta: Record<string, unknown> | undefined): ErrorMeta => ({
  silentError: meta?.silentError === true,
  errorTitle: typeof meta?.errorTitle === 'string' ? meta.errorTitle : undefined,
});
