import { useQuery } from '@tanstack/react-query';
import type { InviteCheckResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

/** null-код (нет ?invite= в адресе) не запрашивается вообще — сразу заглушка «по приглашению». */
function useInviteCheck(code: string | null) {
  return useQuery({
    queryKey: ['auth', 'invite-check', code],
    queryFn: () => apiFetch<InviteCheckResponse>(`/auth/invites/${encodeURIComponent(code!)}`),
    enabled: code !== null,
    retry: false,
    staleTime: 0,
  });
}

export default useInviteCheck;
