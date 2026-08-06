import { useQuery } from '@tanstack/react-query';
import type { PagesResponse } from '@tanuki/contracts';
import { apiFetch } from '../client';

function useChapterPages(sourceId: string, mangaId: string, chapterId: string) {
  return useQuery({
    queryKey: ['pages', sourceId, mangaId, chapterId],
    queryFn: () =>
      apiFetch<PagesResponse>(`/manga/${sourceId}/${mangaId}/chapters/${chapterId}/pages`),
  });
}

export default useChapterPages;
