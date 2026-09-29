import { useState } from 'react';
import { Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { EnvelopeSimpleIcon, LockIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { API_ERROR_CODE, type ChangeEmailRequest } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateEmail, validateRequired } from '@/shared/lib/authValidation';
import useChangeEmail from '../hooks/useChangeEmail';
import FormErrorAlert from '@/shared/ui/FormErrorAlert';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  initialValues: ChangeEmailRequest | null;
  onCodeSent: (request: ChangeEmailRequest) => void;
  onCancel: () => void;
};

function EmailChangeFormStep({ initialValues, onCodeSent, onCancel }: Props) {
  const { t } = useTranslation();
  const changeEmail = useChangeEmail();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ChangeEmailRequest>({
    initialValues: initialValues ?? { newEmail: '', password: '' },
    validate: {
      newEmail: validateEmail(t),
      password: validateRequired(t),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    const request = { newEmail: values.newEmail.trim(), password: values.password };
    setFormError(null);
    changeEmail.mutate(request, {
      onSuccess: () => onCodeSent(request),
      onError: (error) => {
        if (!(error instanceof ApiRequestError)) {
          setFormError(t('tryAgainLater'));
          return;
        }
        switch (error.code) {
          case API_ERROR_CODE.EMAIL_TAKEN:
          case API_ERROR_CODE.BAD_REQUEST:
          case API_ERROR_CODE.VALIDATION_FAILED:
            form.setFieldError('newEmail', error.message);
            return;
          case API_ERROR_CODE.WRONG_PASSWORD:
            form.setFieldError('password', error.message);
            return;
          default:
            setFormError(error.message);
        }
      },
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Text c="dimmed" fz={13}>
          {t('codeGoesToNewEmail')}
        </Text>
        <TextInput
          placeholder={t('newEmail')}
          autoComplete="email"
          leftSection={<EnvelopeSimpleIcon />}
          data-autofocus
          {...form.getInputProps('newEmail')}
        />
        <PasswordInput
          placeholder={t('currentPassword')}
          autoComplete="current-password"
          leftSection={<LockIcon />}
          {...form.getInputProps('password')}
        />
        <FormErrorAlert error={formError} />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            leftSection={<PaperPlaneTiltIcon />}
            loading={changeEmail.isPending}
          >
            {t('getCode')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default EmailChangeFormStep;
