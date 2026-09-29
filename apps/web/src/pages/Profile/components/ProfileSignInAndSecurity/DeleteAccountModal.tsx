import { Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@phosphor-icons/react';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import useDeleteAccount from './hooks/useDeleteAccount';

type Props = {
  opened: boolean;
  onClose: () => void;
};

type FormValues = {
  password: string;
};

function DeleteAccountModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const deleteAccount = useDeleteAccount();

  const form = useForm<FormValues>({
    initialValues: { password: '' },
    validate: { password: validateRequired(t) },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = form.onSubmit((values) => {
    deleteAccount.mutate(values, {
      onError: (error) =>
        form.setFieldError(
          'password',
          error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
        ),
    });
  });

  return (
    <Modal opened={opened} onClose={handleClose} title={t('deleteAccount')} centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text c="dimmed" fz={13}>
            {t('accountDeletionConsequences')}
          </Text>
          <PasswordInput
            placeholder={t('enterPasswordToConfirm')}
            autoComplete="current-password"
            data-autofocus
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              color="red"
              leftSection={<TrashIcon />}
              loading={deleteAccount.isPending}
            >
              {t('deleteAccount')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export default DeleteAccountModal;
