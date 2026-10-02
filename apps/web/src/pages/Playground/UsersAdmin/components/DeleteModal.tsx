import { useState } from 'react';
import { Button, Modal, Paper, Stack, Text, TextInput } from '@mantine/core';
import { TrashIcon, UserIcon } from '@phosphor-icons/react';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { DELETE_CONFIRM, type DeleteConfirm, type MockUser } from '../models';
import UserCell from './UserCell';

type Props = {
  user: MockUser | null;
  confirm: DeleteConfirm;
  onClose: () => void;
  onConfirm: () => void;
};

/** Ключ у родителя — id пользователя, так что введённое имя не переживает повторное открытие. */
function DeleteModal({ user, confirm, onClose, onConfirm }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const [typed, setTyped] = useState('');

  const withCard = confirm !== DELETE_CONFIRM.TYPE_USERNAME;
  const withUsernameInput = confirm !== DELETE_CONFIRM.SIMPLE;
  const isConfirmed =
    !withUsernameInput ||
    (user !== null && typed.trim().toLowerCase() === user.username.toLowerCase());

  return (
    <Modal opened={user !== null} onClose={onClose} title="Удаление аккаунта" centered>
      {user && (
        <Stack gap="md">
          {withCard && (
            <Paper withBorder p="sm" radius="md">
              <Stack gap={6}>
                <UserCell user={user} isSelf={false} />
                <Text fz="xs" c="dimmed">
                  Регистрация{' '}
                  <Text span inherit ff="monospace">
                    {formatDateNumeric(user.createdAt)}
                  </Text>
                </Text>
              </Stack>
            </Paper>
          )}

          <Text fz="sm">
            Аккаунт{' '}
            <Text span inherit fw={600}>
              {user.username}
            </Text>{' '}
            удалится сразу: закладки, история чтения, настройки и сеансы. Восстановить его будет
            нельзя.
          </Text>

          {withUsernameInput && (
            <TextInput
              label="Введите имя пользователя, чтобы подтвердить"
              placeholder={user.username}
              leftSection={<UserIcon />}
              value={typed}
              onChange={(event) => setTyped(event.currentTarget.value)}
            />
          )}

          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button
              color="red"
              leftSection={<TrashIcon />}
              disabled={!isConfirmed}
              onClick={onConfirm}
            >
              {confirm === DELETE_CONFIRM.SIMPLE ? 'Удалить навсегда' : 'Удалить'}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </Modal>
  );
}

export default DeleteModal;
