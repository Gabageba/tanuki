import { useQuery } from '@tanstack/react-query';
import type { InvitesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const INVITES_QUERY_KEY = ['invites'] as const;

function useInvites() {
  return useQuery({
    queryKey: INVITES_QUERY_KEY,
    queryFn: () => apiFetch<InvitesResponse>('/invites'),
  });
}

export default useInvites;
