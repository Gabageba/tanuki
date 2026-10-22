import { useQuery } from '@tanstack/react-query';
import type { ChaptersResponse } from '@tanuki/contracts';
import { apiFetch, isNetworkError } from '@/shared/api/client';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { DEFAULT_CHAPTERS_LIST_KEY } from '@/entities/download/models';
import { updateTitleSnapshot } from '@/entities/download/queue';
import { readChaptersSnapshot } from '@/entities/download/snapshots';

type Params = {
  titleId: string;
  branch?: string;
  enabled?: boolean;
};

/** Без сети у тайтла со скачанным — снимок списка этой ветки, чтобы не скачанные главы тоже были
 *  видны (приглушёнными); свежий ответ этот снимок обновляет. */
function useChapters({ titleId, branch, enabled }: Params) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const listKey = branch ?? DEFAULT_CHAPTERS_LIST_KEY;

  return useQuery({
    enabled,
    queryKey: ['chapters', titleId, branch ?? null],
    queryFn: async () => {
      try {
        const chaptersList = await apiFetch<ChaptersResponse>(
          `/titles/${titleId}/chapters${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`,
        );
        if (userId) {
          void updateTitleSnapshot(userId, titleId, { chaptersList, listKey }).catch(
            () => undefined,
          );
        }
        return chaptersList;
      } catch (error) {
        const snapshot =
          userId && isNetworkError(error)
            ? await readChaptersSnapshot(userId, titleId, listKey)
            : undefined;
        if (snapshot) return snapshot;
        throw error;
      }
    },
  });
}

export default useChapters;
