import { Button, Group, Modal, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { TrashIcon, UserIcon } from '@phosphor-icons/react';
import { Trans, useTranslation } from 'react-i18next';
import type { ManagedUser } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import UserCell from './UserCell';

type FormValues = {
  username: string;
};

type Props = {
  user: ManagedUser | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Видно, кого удаляем, и «Удалить» активна, только когда имя введено (регистр не важен). Ключ у
 *  родителя — id пользователя, так что введённое имя не переживает повторное открытие. */
function DeleteUserModal({ user, isPending, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();
  const form = useForm<FormValues>({ initialValues: { username: '' } });

  const isConfirmed =
    user !== null && form.values.username.trim().toLowerCase() === user.username.toLowerCase();

  const handleSubmit = form.onSubmit(() => {
    if (isConfirmed) onConfirm();
  });

  return (
    <Modal opened={user !== null} onClose={onClose} title={t('accountDeletion')} centered>
      {user && (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Paper withBorder p="sm" radius="md">
              <Stack gap={6}>
                <UserCell user={user} isSelf={false} />
                <Group gap={4}>
                  <Text fz="xs" c="dimmed">
                    {t('registration')}
                  </Text>
                  <Text fz="xs" c="dimmed" ff="monospace">
                    {formatDateNumeric(user.createdAt)}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Text c="dimmed" fz={13}>
              <Trans
                i18nKey="accountDeletedImmediately"
                values={{ username: user.username }}
                components={{ b: <Text span inherit fw={600} /> }}
              />
            </Text>

            <TextInput
              placeholder={t('enterUsernameToConfirm')}
              leftSection={<UserIcon />}
              {...form.getInputProps('username')}
            />

            <ModalButtonsLayout>
              <Button variant="default" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                color="red"
                leftSection={<TrashIcon />}
                disabled={!isConfirmed}
                loading={isPending}
              >
                {t('delete')}
              </Button>
            </ModalButtonsLayout>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

export default DeleteUserModal;
