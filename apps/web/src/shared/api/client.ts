import { API_ERROR_CODE, type ApiError, type ApiErrorCode } from '@tanuki/contracts';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/v1${path}`, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.error.message ?? response.statusText,
      body?.error.code ?? API_ERROR_CODE.PARSER_FAILED,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
