import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import EmailLinkScreen from '@/entities/user/EmailLinkScreen';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

/** Ссылка отмены из письма об удалении — сервер снимает удаление и сразу логинит. */
function CancelAccountDeletion() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <EmailLinkScreen
      mutationFn={async (token) => {
        const user = await apiFetch<CurrentUser>('/account/deletion/cancel', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      }}
      onSuccess={() => {
        notifications.show({ color: 'green', message: t('deletionCancelled') });
        navigate(ROUTE_PATHS.SOURCES, { replace: true });
      }}
    />
  );
}

export default CancelAccountDeletion;
