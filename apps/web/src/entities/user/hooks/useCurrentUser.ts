import { useQuery } from '@tanstack/react-query';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const;

/**
 * `data === null` значит «точно гость» (401 от сервера), `data === undefined` — ещё не знаем.
 * RequireAuth/GuestOnly различают эти два состояния через isPending, а не через сам data.
 */
function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async (): Promise<CurrentUser | null> => {
      try {
        return await apiFetch<CurrentUser>('/auth/me');
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
    // Фоновая проверка сессии — её сбой человеку сообщать незачем.
    meta: SILENT_ERROR_META,
  });
}

export default useCurrentUser;
