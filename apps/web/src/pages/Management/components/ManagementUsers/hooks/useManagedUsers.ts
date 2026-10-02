import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ManagedUsersQuery, ManagedUsersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const MANAGED_USERS_QUERY_KEY = ['managedUsers'] as const;

/** Пока грузится следующая страница или новый фильтр, таблица показывает прежние строки. */
function useManagedUsers({ page, query, role, status, sort, direction }: ManagedUsersQuery) {
  return useQuery({
    queryKey: [...MANAGED_USERS_QUERY_KEY, { page, query, role, status, sort, direction }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), sort, direction });
      if (query) params.set('query', query);
      role?.forEach((value) => params.append('role', value));
      status?.forEach((value) => params.append('status', value));
      return apiFetch<ManagedUsersResponse>(`/users?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export default useManagedUsers;
