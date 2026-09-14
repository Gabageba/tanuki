import { useQuery } from '@tanstack/react-query';
import type { PagesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  mangaId: string;
  chapterId: string;
};

function useChapterPages({ mangaId, chapterId }: Params) {
  return useQuery({
    queryKey: ['pages', mangaId, chapterId],
    queryFn: () => apiFetch<PagesResponse>(`/manga/${mangaId}/chapters/${chapterId}/pages`),
  });
}

export default useChapterPages;
