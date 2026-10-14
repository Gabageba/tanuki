import { API_ERROR_CODE, type ApiError, type ApiErrorCode } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';

/** `status === NETWORK_ERROR_STATUS` — до сервера не достучались, ответа нет вовсе. */
export const NETWORK_ERROR_STATUS = 0;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
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
 * Текст ошибки приходит с сервера уже на языке интерфейса — язык передаётся в Accept-Language.
 * Свой текст у фронта только на случай, когда сервер ответить не смог.
 */
export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
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
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.error.message ?? I18N.t('somethingWentWrong'),
      body?.error.code ?? API_ERROR_CODE.INTERNAL,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
