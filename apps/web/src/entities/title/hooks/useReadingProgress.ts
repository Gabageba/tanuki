import { useQuery } from '@tanstack/react-query';
import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const getReadingProgressQueryKey = (titleId: string) =>
  ['reading-progress', titleId] as const;

type Params = {
  titleId: string;
};

function useReadingProgress({ titleId }: Params) {
  return useQuery({
    queryKey: getReadingProgressQueryKey(titleId),
    queryFn: () => apiFetch<TitleReadingProgressResponse>(`/titles/${titleId}/progress`),
  });
}

export default useReadingProgress;
