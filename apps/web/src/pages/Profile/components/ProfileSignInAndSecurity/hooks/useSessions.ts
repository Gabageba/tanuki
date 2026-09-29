import { useQuery } from '@tanstack/react-query';
import type { SessionsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const SESSIONS_QUERY_KEY = ['account', 'sessions'];

function useSessions() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => apiFetch<SessionsResponse>('/account/sessions'),
    select: (data) => data.items,
  });
}

export default useSessions;
