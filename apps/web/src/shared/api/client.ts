import type { ApiError } from '@tanuki/contracts';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.error.message ?? response.statusText,
      body?.error.code ?? 'PARSER_FAILED',
      response.status,
    );
  }

  return (await response.json()) as T;
}
