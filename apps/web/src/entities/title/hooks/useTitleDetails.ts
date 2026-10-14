import { useQuery } from '@tanstack/react-query';
import type { TitleDetailsResponse } from '@tanuki/contracts';
import { apiFetch, isNetworkError } from '@/shared/api/client';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { updateTitleSnapshot } from '@/entities/download/queue';
import { readTitleDetailsSnapshot } from '@/entities/download/snapshots';

type Params = {
  titleId: string;
};

/** Без сети у тайтла со скачанным — его снимок; свежий ответ этот снимок обновляет. */
function useTitleDetails({ titleId }: Params) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ['title', titleId],
    queryFn: async () => {
      try {
        const details = await apiFetch<TitleDetailsResponse>(`/titles/${titleId}`);
        if (userId) void updateTitleSnapshot(userId, titleId, { details }).catch(() => undefined);
        return details;
      } catch (error) {
        const snapshot =
          userId && isNetworkError(error)
            ? await readTitleDetailsSnapshot(userId, titleId)
            : undefined;
        if (snapshot) return snapshot;
        throw error;
      }
    },
  });
}

export default useTitleDetails;
