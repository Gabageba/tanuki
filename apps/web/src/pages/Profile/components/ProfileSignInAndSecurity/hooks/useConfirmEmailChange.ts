import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConfirmEmailChangeRequest, CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useConfirmEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    // Неверный код показывается под полем ввода — общее уведомление не нужно.
    meta: SILENT_ERROR_META,
    mutationFn: (body: ConfirmEmailChangeRequest) =>
      apiFetch<CurrentUser>('/account/email/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export default useConfirmEmailChange;
