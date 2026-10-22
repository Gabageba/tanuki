import { useQuery } from '@tanstack/react-query';
import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import { apiFetch, isNetworkError } from '@/shared/api/client';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { applyPendingProgress } from '../progressSync';

export const getReadingProgressQueryKey = (titleId: string) =>
  ['reading-progress', titleId] as const;

type Params = {
  titleId: string;
};

/** Отметка, которая ещё не ушла без сети, свежее серверной — список глав и «Продолжить» видят её. */
function useReadingProgress({ titleId }: Params) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: getReadingProgressQueryKey(titleId),
    queryFn: async () => {
      try {
        const response = await apiFetch<TitleReadingProgressResponse>(
          `/titles/${titleId}/progress`,
        );
        return userId ? await applyPendingProgress(userId, titleId, response) : response;
      } catch (error) {
        if (!userId || !isNetworkError(error)) throw error;
        const offline = await applyPendingProgress(userId, titleId, { own: null, linked: [] });
        if (offline.own) return offline;
        throw error;
      }
    },
  });
}

export default useReadingProgress;
