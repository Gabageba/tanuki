import { Button, Checkbox, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { FloppyDiskIcon, KeyIcon } from '@phosphor-icons/react';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validatePassword, validateRequired } from '@/shared/lib/authValidation';
import useChangePassword from './hooks/useChangePassword';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

type FormValues = {
  currentPassword: string;
  newPassword: string;
  signOutOtherDevices: boolean;
};

function ChangePasswordModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const changePassword = useChangePassword();

  const form = useForm<FormValues>({
    initialValues: { currentPassword: '', newPassword: '', signOutOtherDevices: true },
    validate: {
      currentPassword: validateRequired(t),
      newPassword: validatePassword(t),
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = form.onSubmit((values) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        Toasts.show({ tone: FEEDBACK_TONE.SUCCESS, title: t('passwordChanged') });
        handleClose();
      },
      onError: (error) => {
        if (!(error instanceof ApiRequestError)) {
          form.setFieldError('currentPassword', t('tryAgainLater'));
          return;
        }
        if (error.code === API_ERROR_CODE.VALIDATION_FAILED) {
          form.setFieldError('newPassword', error.message);
          return;
        }
        form.setFieldError('currentPassword', error.message);
      },
    });
  });

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={KeyIcon}
      opened={opened}
      onClose={handleClose}
      title={t('changePassword')}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <PasswordInput
            placeholder={t('currentPassword')}
            autoComplete="current-password"
            data-autofocus
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            placeholder={t('newPassword')}
            autoComplete="new-password"
            {...form.getInputProps('newPassword')}
          />
          <Checkbox
            label={t('signOutOnOtherDevices')}
            {...form.getInputProps('signOutOtherDevices', { type: 'checkbox' })}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              leftSection={<FloppyDiskIcon />}
              loading={changePassword.isPending}
            >
              {t('save')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default ChangePasswordModal;
