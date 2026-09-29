import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import EmailLinkScreen from '@/entities/user/EmailLinkScreen';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

/** «Это был не я» из письма на прежнюю почту: сервер вернул почту и завершил все сеансы. */
function RevertEmailChange() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    notifications.show({
      color: 'green',
      title: t('emailChangeCancelled'),
      message: t('allDevicesSignedOut'),
    });
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    navigate(ROUTE_PATHS.LOGIN, { replace: true });
  };

  return (
    <EmailLinkScreen
      mutationFn={(token) =>
        apiFetch('/account/email/revert', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      }
      onSuccess={handleSuccess}
    />
  );
}

export default RevertEmailChange;
