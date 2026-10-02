import { useState } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SignInIcon, UserIcon } from '@phosphor-icons/react';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ResendVerificationButton from '@/entities/user/ResendVerificationButton';
import useLogin from '@/entities/user/hooks/useLogin';
import { setPendingLogin } from '@/entities/user/pendingLogin';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';
import FormErrorAlert from '@/shared/ui/FormErrorAlert';

type FormValues = {
  login: string;
  password: string;
  remember: boolean;
};

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  // Срок и причина блокировки — текст с сервера уже на языке интерфейса.
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { login: '', password: '', remember: false },
    validate: {
      login: validateRequired(t),
      password: validateRequired(t),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setUnverifiedEmail(null);
    setBlockedMessage(null);
    login.mutate(values, {
      onSuccess: () => {
        const redirect = searchParams.get('redirect');
        navigate(redirect ? decodeURIComponent(redirect) : ROUTE_PATHS.SOURCES, {
          replace: true,
        });
      },
      onError: (error) => {
        if (error instanceof ApiRequestError) {
          if (error.code === API_ERROR_CODE.EMAIL_NOT_VERIFIED) {
            setUnverifiedEmail(values.login);
            return;
          }
          if (error.code === API_ERROR_CODE.ACCOUNT_BLOCKED) {
            setBlockedMessage(error.message);
            return;
          }
          if (error.code === API_ERROR_CODE.ACCOUNT_DELETION_SCHEDULED) {
            setPendingLogin(values);
            navigate({
              pathname: ROUTE_PATHS.ACCOUNT_DELETION_SCHEDULED,
              search: searchParams.toString(),
            });
            return;
          }
          if (error.code === API_ERROR_CODE.INVALID_CREDENTIALS) {
            // Сервер не говорит, что именно не так — подсвечиваем оба поля, текст один под паролем.
            form.setErrors({ login: true, password: error.message });
            return;
          }
          form.setFieldError('password', error.message);
          return;
        }
        form.setFieldError('password', t('tryAgainLater'));
      },
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <AuthFormLayout title={t('welcomeBack')} description={t('continueWhereYouLeftOff')}>
        {unverifiedEmail && (
          <Stack gap={4} align="center">
            <Text size="sm" c="dimmed" ta="center">
              {t('emailNotConfirmedYet')}
            </Text>
            <ResendVerificationButton email={unverifiedEmail} />
          </Stack>
        )}

        <Stack w="100%" align="center">
          <Stack gap="sm" w="100%">
            <FormErrorAlert error={blockedMessage} />
            <TextInput
              autoComplete="username"
              {...form.getInputProps('login')}
              leftSection={<UserIcon />}
            />
            <PasswordInput autoComplete="current-password" {...form.getInputProps('password')} />
            <Group justify="space-between">
              <Checkbox
                size="xs"
                label={t('rememberMe')}
                {...form.getInputProps('remember', { type: 'checkbox' })}
              />
              <Anchor component={Link} to={ROUTE_PATHS.FORGOT_PASSWORD} size="sm" fz={12}>
                {t('forgotPassword')}
              </Anchor>
            </Group>
          </Stack>

          <Button type="submit" loading={login.isPending} leftSection={<SignInIcon />} fullWidth>
            {t('logIn')}
          </Button>

          <Divider w="100%" />

          <Text size="sm" c="dimmed" fz={12}>
            {t('noAccountYet')}{' '}
            <Anchor component={Link} to={ROUTE_PATHS.REGISTER} fz={12}>
              {t('create')}
            </Anchor>
          </Text>
        </Stack>
      </AuthFormLayout>
    </form>
  );
}

export default Login;
