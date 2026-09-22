import { Anchor, Divider, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

/** Показывается и без ?invite= в адресе, и когда код в нём не прошёл проверку на сервере. */
function RegistrationClosedStub() {
  const { t } = useTranslation();

  return (
    <AuthFormLayout title={t('registrationUnavailable')} description={t('contactAdminForInvite')}>
      <Stack w="100%" align="center">
        <Divider w="100%" />
        <Anchor component={Link} to={ROUTE_PATHS.LOGIN} fz={12} lh={1} w="fit-content">
          {t('logIn')}
        </Anchor>
      </Stack>
    </AuthFormLayout>
  );
}

export default RegistrationClosedStub;
