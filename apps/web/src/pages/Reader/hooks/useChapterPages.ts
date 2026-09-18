import { useQuery } from '@tanstack/react-query';
import type { PagesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  titleId: string;
  chapterId: string;
};

function useChapterPages({ titleId, chapterId }: Params) {
  return useQuery({
    queryKey: ['pages', titleId, chapterId],
    queryFn: () => apiFetch<PagesResponse>(`/titles/${titleId}/chapters/${chapterId}/pages`),
  });
}

export default useChapterPages;
