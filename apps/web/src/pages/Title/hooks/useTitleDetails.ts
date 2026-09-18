import { useQuery } from '@tanstack/react-query';
import type { TitleDetailsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  titleId: string;
};

function useTitleDetails({ titleId }: Params) {
  return useQuery({
    queryKey: ['title', titleId],
    queryFn: () => apiFetch<TitleDetailsResponse>(`/titles/${titleId}`),
  });
}

export default useTitleDetails;
