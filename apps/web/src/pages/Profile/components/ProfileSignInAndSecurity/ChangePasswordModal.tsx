import { Button, Checkbox, Modal, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validatePassword, validateRequired } from '@/shared/lib/authValidation';
import useChangePassword from './hooks/useChangePassword';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

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
        notifications.show({ color: 'green', message: t('passwordChanged') });
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
    <Modal opened={opened} onClose={handleClose} title={t('changePassword')} centered>
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
    </Modal>
  );
}

export default ChangePasswordModal;
