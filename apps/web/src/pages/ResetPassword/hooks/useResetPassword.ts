import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser, ResetPasswordRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ResetPasswordRequest) =>
      apiFetch<CurrentUser>('/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useResetPassword;
