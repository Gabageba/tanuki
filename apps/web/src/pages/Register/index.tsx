import { useState } from 'react';
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Divider,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useSearchParams } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { API_ERROR_CODE, type Language } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateEmail, validatePassword, validateUsername } from '@/shared/lib/authValidation';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ResendVerificationButton from '@/entities/user/ResendVerificationButton';
import RegistrationClosedStub from './components/RegistrationClosedStub';
import UsernameInput from './components/UsernameInput';
import useCheckUsername from './hooks/useCheckUsername';
import useInviteCheck from './hooks/useInviteCheck';
import useRegister from './hooks/useRegister';
import { readSubmittedEmail, writeSubmittedEmail } from './models';
import type { RegisterFormValues } from './models';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

function Register() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const inviteCheck = useInviteCheck(inviteCode);
  const register = useRegister();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(() =>
    readSubmittedEmail(inviteCode),
  );
  const [inviteBurned, setInviteBurned] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: { email: '', username: '', password: '', termsAccepted: false },
    validate: {
      email: validateEmail(t),
      username: validateUsername(t),
      password: validatePassword(t),
      termsAccepted: (value) => (value ? null : t('acceptTermsToContinue')),
    },
  });

  const usernameCheck = useCheckUsername(form.values.username, inviteCode ?? '');

  if (submittedEmail) {
    return (
      <AuthFormLayout
        title={t('checkYourEmail')}
        description={t('weSentLinkTo', { email: submittedEmail })}
      >
        <ResendVerificationButton email={submittedEmail} />
      </AuthFormLayout>
    );
  }

  if (!inviteCode || inviteBurned) {
    return <RegistrationClosedStub />;
  }

  if (inviteCheck.isPending) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (!inviteCheck.data?.valid) {
    return <RegistrationClosedStub />;
  }

  const handleSubmit = form.onSubmit((values) => {
    register.mutate(
      {
        inviteCode,
        email: values.email.trim(),
        username: values.username,
        password: values.password,
        language: i18n.language as Language,
      },
      {
        onSuccess: () => {
          const email = values.email.trim();
          writeSubmittedEmail(inviteCode, email);
          setSubmittedEmail(email);
        },
        onError: (error) => {
          if (error instanceof ApiRequestError) {
            if (error.code === API_ERROR_CODE.EMAIL_TAKEN) {
              form.setFieldError('email', error.message);
              return;
            }
            if (error.code === API_ERROR_CODE.USERNAME_TAKEN) {
              form.setFieldError('username', error.message);
              return;
            }
            if (error.code === API_ERROR_CODE.INVITE_INVALID) {
              setInviteBurned(true);
              return;
            }
            form.setFieldError('password', error.message);
            return;
          }
          form.setFieldError('password', t('tryAgainLater'));
        },
      },
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <AuthFormLayout title={t('createAccount')} description={t('favoriteTitlesInOnePlace')}>
        <Stack w="100%">
          <TextInput
            autoComplete="email"
            leftSection={<EnvelopeSimpleIcon />}
            {...form.getInputProps('email')}
          />
          <UsernameInput form={form} usernameCheck={usernameCheck} />
          <PasswordInput autoComplete="new-password" {...form.getInputProps('password')} />
          <Checkbox
            label={
              <Trans
                i18nKey="acceptTermsAndPrivacyPolicy"
                components={{
                  terms: (
                    <Anchor
                      component={Link}
                      to={ROUTE_PATHS.TERMS}
                      target="_blank"
                      inherit
                      fz="inherit"
                    />
                  ),
                  privacy: (
                    <Anchor
                      component={Link}
                      to={ROUTE_PATHS.PRIVACY_POLICY}
                      target="_blank"
                      inherit
                      fz="inherit"
                    />
                  ),
                }}
              />
            }
            fz={12}
            size="xs"
            {...form.getInputProps('termsAccepted', { type: 'checkbox' })}
          />

          <Button
            type="submit"
            loading={register.isPending}
            disabled={usernameCheck.data?.available === false}
            fullWidth
          >
            {t('createAccount')}
          </Button>
          <Divider w="100%" />
          <Text size="sm" c="dimmed" ta="center" fz={12}>
            {t('alreadyHaveAccount')}{' '}
            <Anchor component={Link} to={ROUTE_PATHS.LOGIN} fz={12}>
              {t('logIn')}
            </Anchor>
          </Text>
        </Stack>
      </AuthFormLayout>
    </form>
  );
}

export default Register;
