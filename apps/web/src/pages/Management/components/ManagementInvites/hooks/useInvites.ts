import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { InvitesQuery, InvitesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const INVITES_QUERY_KEY = ['invites'] as const;

/** Пока грузится следующая страница или новый фильтр, таблица показывает прежние строки. */
function useInvites({ page, status, role, sort, direction }: InvitesQuery) {
  return useQuery({
    queryKey: [...INVITES_QUERY_KEY, { page, status, role, sort, direction }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), sort, direction });
      status?.forEach((value) => params.append('status', value));
      role?.forEach((value) => params.append('role', value));
      return apiFetch<InvitesResponse>(`/invites?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export default useInvites;
