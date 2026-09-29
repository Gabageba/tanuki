import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser, LoginRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    // Форма раскладывает ошибку по своим полям — общее уведомление не нужно.
    meta: SILENT_ERROR_META,
    mutationFn: (body: LoginRequest) =>
      apiFetch<CurrentUser>('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useLogin;
