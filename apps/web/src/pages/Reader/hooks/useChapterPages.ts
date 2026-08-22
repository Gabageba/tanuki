import { useQuery } from '@tanstack/react-query';
import type { PagesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string;
  mangaId: string;
  chapterId: string;
};

function useChapterPages({ sourceId, mangaId, chapterId }: Params) {
  return useQuery({
    queryKey: ['pages', sourceId, mangaId, chapterId],
    queryFn: () =>
      apiFetch<PagesResponse>(`/manga/${sourceId}/${mangaId}/chapters/${chapterId}/pages`),
  });
}

export default useChapterPages;
