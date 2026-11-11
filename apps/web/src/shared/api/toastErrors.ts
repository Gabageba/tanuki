import { API_ERROR_CODE } from '@tanuki/contracts';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { I18N } from '@/shared/lib/i18n';
import { ApiRequestError, isNetworkError } from './client';

export const shouldSilenceToastError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  (isNetworkError(error) && !navigator.onLine);

/** Причина, а не переведённый текст. Неизвестные 500 разных операций не считаем одним сбоем. */
export const getReadErrorKey = (error: unknown, queryHash: string, scope?: string) => {
  if (!(error instanceof ApiRequestError)) return `read:client:${queryHash}`;
  const titleId = error.requestPath?.match(/^\/titles\/([^/?]+)/)?.[1];
  const source =
    scope ??
    error.requestPath?.match(/^\/sources\/([^/?]+)/)?.[1] ??
    (titleId?.includes(':') ? titleId.split(':')[0] : undefined);
  if (isNetworkError(error)) return 'read:network';
  if (error.code === API_ERROR_CODE.INTERNAL && [502, 503, 504].includes(error.status)) {
    return `read:gateway:${error.status}`;
  }
  if (source) return `read:source:${source}:${error.status}:${error.code}`;
  return `read:${queryHash}:${error.status}:${error.code}`;
};

export const showToastError = (
  error: unknown,
  title?: string,
  key?: string,
  suppressAfterClose = false,
) => {
  if (shouldSilenceToastError(error)) return;
  const message = error instanceof ApiRequestError ? error.message : I18N.t('somethingWentWrong');
  return Toasts.show({
    tone: FEEDBACK_TONE.DANGER,
    title: title ?? message,
    description: title && title !== message ? message : undefined,
    key,
    suppressAfterClose,
  });
};
