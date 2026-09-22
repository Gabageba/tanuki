import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiFetch } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { CURRENT_USER_QUERY_KEY } from './useCurrentUser';

function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      navigate(ROUTE_PATHS.LOGIN);
    },
  });
}

export default useLogout;
