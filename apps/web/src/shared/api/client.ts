import { API_ERROR_CODE, type ApiError, type ApiErrorCode } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';

/** `status === NETWORK_ERROR_STATUS` — до сервера не достучались, ответа нет вовсе. */
export const NETWORK_ERROR_STATUS = 0;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly requestPath?: string,
  ) {
    super(message);
  }
}

/** До сервера не достучались: нет сети или он лежит. */
export const isNetworkError = (error: unknown) =>
  error instanceof ApiRequestError && error.status === NETWORK_ERROR_STATUS;

/** Запрошенного объекта нет — повтор запроса ответит тем же. */
export const isNotFoundError = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.NOT_FOUND;

/** Источник закрыт: у пользователя нет на нём своего аккаунта или сессия аккаунта истекла. */
export const isSourceAccountRequiredError = (error: unknown) =>
  error instanceof ApiRequestError &&
  (error.code === API_ERROR_CODE.SOURCE_ACCOUNT_REQUIRED ||
    error.code === API_ERROR_CODE.SOURCE_RELOGIN_REQUIRED);

/** Аккаунт на источнике привязан, но его сессия истекла. */
export const isSourceReloginRequiredError = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.SOURCE_RELOGIN_REQUIRED;

/** Источник открыт, но именно это он отдаёт только авторизованным. */
export const isSourceAuthRequiredError = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.SOURCE_AUTH_REQUIRED;

/** Источник или тайтл 18+ скрыт настройками самого пользователя. */
export const isAdultContentHiddenError = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.ADULT_CONTENT_HIDDEN;

/**
 * Запрос к API с разбором ошибки. Текст ошибки приходит с сервера уже на языке интерфейса — язык
 * передаётся в Accept-Language. Свой текст у фронта только на случай, когда сервер ответить не смог.
 */
const apiRequest = async (path: string, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  headers.set('accept-language', document.documentElement.lang);

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { ...init, headers });
  } catch (error) {
    // Отмена запроса — не сбой сети, её ждёт тот, кто отменял.
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiRequestError(
      I18N.t('noConnectionToServer'),
      API_ERROR_CODE.INTERNAL,
      NETWORK_ERROR_STATUS,
      path,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.error.message ?? I18N.t('somethingWentWrong'),
      body?.error.code ?? API_ERROR_CODE.INTERNAL,
      response.status,
      path,
    );
  }

  return response;
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiRequest(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

/** Кадр потока SSE: `event:` и склеенные строки `data:`. */
export type ApiStreamEvent = {
  event: string;
  data: string;
};

/** Разбирает текст потока на кадры; недописанный хвост возвращает, чтобы дочитать с новой порцией. */
const parseStreamFrames = (buffer: string) => {
  const frames = buffer.split(/\r?\n\r?\n/);
  const rest = frames.pop() ?? '';
  const events = frames.flatMap((frame): ApiStreamEvent[] => {
    let event = 'message';
    const data: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      const separator = line.indexOf(':');
      // Строка с двоеточия — комментарий (пульс), в данные не идёт.
      if (separator === 0) continue;
      const field = separator === -1 ? line : line.slice(0, separator);
      const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      if (field === 'data') data.push(value);
    }
    return data.length ? [{ event, data: data.join('\n') }] : [];
  });
  return { events, rest };
};

/**
 * Поток SSE через `fetch`, а не `EventSource`: его отменяет сигнал запроса, а ошибка до начала
 * потока (400, 401) приходит обычным `ApiRequestError`.
 */
export async function* apiStream(path: string, init?: RequestInit) {
  const response = await apiRequest(path, init);
  if (!response.body) return;

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const { events, rest } = parseStreamFrames(buffer + value);
      buffer = rest;
      yield* events;
    }
  } finally {
    reader.releaseLock();
  }
}
