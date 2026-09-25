import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<CurrentUser>('/users/me/avatar', { method: 'DELETE' }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useDeleteAvatar;
