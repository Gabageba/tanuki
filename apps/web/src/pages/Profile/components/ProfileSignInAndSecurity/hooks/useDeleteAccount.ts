import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { DeleteAccountRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    meta: SILENT_ERROR_META,
    mutationFn: (body: DeleteAccountRequest) =>
      apiFetch('/account/deletion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    // Сервер уже завершил все сеансы — здесь только забываем пользователя и уходим ко входу.
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      navigate(ROUTE_PATHS.LOGIN, { replace: true });
    },
  });
}

export default useDeleteAccount;
