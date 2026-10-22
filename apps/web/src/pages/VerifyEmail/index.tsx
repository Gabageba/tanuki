import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import EmailLinkScreen from '@/entities/user/EmailLinkScreen';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

/** Ссылка из письма подтверждения — сервер подтверждает почту и сразу логинит. */
function VerifyEmail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <EmailLinkScreen
      mutationFn={async (token) => {
        const user = await apiFetch<CurrentUser>('/auth/verify-email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      }}
      onSuccess={() => navigate(ROUTE_PATHS.HOME, { replace: true })}
    />
  );
}

export default VerifyEmail;
