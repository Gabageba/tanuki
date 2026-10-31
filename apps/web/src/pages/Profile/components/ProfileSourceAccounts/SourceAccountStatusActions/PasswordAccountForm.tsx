import { Button, Checkbox, Divider, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { EnvelopeIcon, PasswordIcon, SignInIcon, UserIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { LinkSourceAccountRequest } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateEmail, validateRequired } from '@/shared/lib/authValidation';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  isPending: boolean;
  onSubmit: (values: LinkSourceAccountRequest) => Promise<unknown>;
  onCancel: () => void;
  meta?: ReactNode;
  emailOnly?: boolean;
};

/** Логин и пароль аккаунта источника — сервер сам входит с ними на сайт. */
function PasswordAccountForm({ isPending, onSubmit, onCancel, meta, emailOnly = false }: Props) {
  const { t } = useTranslation();

  const form = useForm<LinkSourceAccountRequest>({
    initialValues: { login: '', password: '', rememberPassword: false },
    validate: {
      login: emailOnly ? validateEmail(t) : validateRequired(t),
      password: validateRequired(t),
    },
  });

  const handleSubmit = form.onSubmit((values) =>
    onSubmit(values).catch((error: unknown) =>
      form.setFieldError(
        'password',
        error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      ),
    ),
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack>
        <TextInput
          placeholder={t(emailOnly ? 'email' : 'loginOrEmail')}
          type={emailOnly ? 'email' : 'text'}
          autoComplete="off"
          leftSection={emailOnly ? <EnvelopeIcon /> : <UserIcon />}
          data-autofocus
          {...form.getInputProps('login')}
        />
        <PasswordInput
          leftSection={<PasswordIcon />}
          placeholder={t('password')}
          autoComplete="off"
          {...form.getInputProps('password')}
        />
        <Checkbox
          label={t('rememberPasswordForAutoLogin')}
          description={t('passwordStoredEncrypted')}
          {...form.getInputProps('rememberPassword', { type: 'checkbox' })}
        />
        {meta && (
          <>
            <Divider />
            {meta}
          </>
        )}

        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" leftSection={<SignInIcon />} loading={isPending}>
            {t('logIn')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default PasswordAccountForm;
