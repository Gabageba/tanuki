import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangePasswordRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { SESSIONS_QUERY_KEY } from './useSessions';

function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: SILENT_ERROR_META,
    mutationFn: (body: ChangePasswordRequest) =>
      apiFetch('/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
  });
}

export default useChangePassword;
