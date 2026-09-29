import { useState } from 'react';
import { Anchor, Button, Divider, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import type { Language } from '@tanuki/contracts';
import { validateEmail } from '@/shared/lib/authValidation';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useForgotPassword from './hooks/useForgotPassword';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

type FormValues = {
  email: string;
};

function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { email: '' },
    validate: { email: validateEmail(t) },
  });

  if (submitted) {
    return (
      <AuthFormLayout title={t('checkYourEmail')} description={t('weSentLinkIfExists')}>
        <Stack w="100%" align="center">
          <Divider w="100%" />
          <Anchor component={Link} to={ROUTE_PATHS.LOGIN} lh={1} fz={12}>
            {t('backToLogin')}
          </Anchor>
        </Stack>
      </AuthFormLayout>
    );
  }

  const handleSubmit = form.onSubmit((values) => {
    forgotPassword.mutate(
      { email: values.email.trim(), language: i18n.language as Language },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <AuthFormLayout title={t('forgotPassword')} description={t('enterEmailForReset')}>
        <Stack w="100%" align="center">
          <TextInput
            autoComplete="email"
            {...form.getInputProps('email')}
            leftSection={<EnvelopeSimpleIcon />}
            w="100%"
          />
          <Button type="submit" loading={forgotPassword.isPending} fullWidth>
            {t('sendLink')}
          </Button>

          <Divider w="100%" />
          <Anchor
            component={Link}
            to={ROUTE_PATHS.LOGIN}
            fz={12}
            lh={1}
            ta="center"
            display="block"
            w="fit-content"
          >
            {t('backToLogin')}
          </Anchor>
        </Stack>
      </AuthFormLayout>
    </form>
  );
}

export default ForgotPassword;
