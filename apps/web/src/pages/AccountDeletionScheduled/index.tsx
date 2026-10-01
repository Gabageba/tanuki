import { useEffect, useState } from 'react';
import { Anchor, Button, Divider, Stack } from '@mantine/core';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { ApiRequestError } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useLogin from '@/entities/user/hooks/useLogin';
import { getPendingLogin, setPendingLogin } from '@/entities/user/pendingLogin';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';
import FormErrorAlert from '@/shared/ui/FormErrorAlert';

/** Вход упёрся в запланированное удаление — повторный вход с тем же паролем его отменяет. */
function AccountDeletionScheduled() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const [pendingLogin] = useState(getPendingLogin);

  // Пароль не должен пережить уход со страницы.
  useEffect(() => () => setPendingLogin(null), []);

  const loginPath = { pathname: ROUTE_PATHS.LOGIN, search: searchParams.toString() };

  // Открыли напрямую или перезагрузили — логина с паролем нет, отменять нечем.
  if (!pendingLogin) return <Navigate to={loginPath} replace />;

  const handleCancelDeletion = () => {
    login.mutate(
      { ...pendingLogin, cancelDeletion: true },
      {
        onSuccess: () => {
          const redirect = searchParams.get('redirect');
          navigate(redirect ? decodeURIComponent(redirect) : ROUTE_PATHS.SOURCES, {
            replace: true,
          });
        },
      },
    );
  };

  return (
    <AuthFormLayout
      title={t('accountScheduledForDeletion')}
      description={t('loggingInCancelsDeletion')}
    >
      <Stack w="100%" align="center">
        {login.isError && (
          <FormErrorAlert
            error={
              login.isError
                ? login.error instanceof ApiRequestError
                  ? login.error.message
                  : t('tryAgainLater')
                : null
            }
          />
        )}
        <Button
          leftSection={<ArrowCounterClockwiseIcon />}
          loading={login.isPending}
          onClick={handleCancelDeletion}
          fullWidth
        >
          {t('cancelDeletionAndLogIn')}
        </Button>
        <Divider w="100%" />
        <Anchor component={Link} to={loginPath} replace fz={12} lh="tight">
          {t('backToLogin')}
        </Anchor>
      </Stack>
    </AuthFormLayout>
  );
}

export default AccountDeletionScheduled;
