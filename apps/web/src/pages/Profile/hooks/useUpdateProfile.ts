import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser, UpdateProfileRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) =>
      apiFetch<CurrentUser>('/users/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useUpdateProfile;
