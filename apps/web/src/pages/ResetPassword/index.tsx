import { Button, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LockIcon } from '@phosphor-icons/react';
import { ApiRequestError } from '@/shared/api/client';
import { validatePassword } from '@/shared/lib/authValidation';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useResetPassword from './hooks/useResetPassword';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

type FormValues = {
  password: string;
};

function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const resetPassword = useResetPassword();

  const form = useForm<FormValues>({
    initialValues: { password: '' },
    validate: { password: validatePassword(t) },
  });

  const handleSubmit = form.onSubmit((values) => {
    resetPassword.mutate(
      { token, password: values.password },
      {
        onSuccess: () => navigate(ROUTE_PATHS.HOME, { replace: true }),
        onError: (error) =>
          form.setFieldError(
            'password',
            error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
          ),
      },
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <AuthFormLayout title={t('newPassword')} description={t('comeUpWithNewPassword')}>
        <Stack w="100%">
          <PasswordInput
            autoComplete="new-password"
            {...form.getInputProps('password')}
            placeholder={t('newPassword')}
            leftSection={<LockIcon />}
          />

          <Button type="submit" loading={resetPassword.isPending} fullWidth>
            {t('save')}
          </Button>
        </Stack>
      </AuthFormLayout>
    </form>
  );
}

export default ResetPassword;
