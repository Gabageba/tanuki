import { Avatar, Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { TrashIcon, UserIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MESSAGE_TONE, type MessagePattern } from '../models';
import ModalMessage from './ModalMessage';
import PatternModal from './PatternModal';

type Props = {
  opened: boolean;
  pattern: MessagePattern;
  onClose: () => void;
};

type FormValues = {
  username: string;
};

const USERNAME = 'webtoon_guy';

/** Копия «Удаления аккаунта» из «Управления»: карточка, текст, ввод имени. */
function DemoDeleteUserModal({ opened, pattern, onClose }: Props) {
  const form = useForm<FormValues>({ initialValues: { username: '' } });
  const isConfirmed = form.values.username.trim().toLowerCase() === USERNAME;
  const handleSubmit = form.onSubmit(() => {
    if (isConfirmed) onClose();
  });
  const main = (
    <>
      Аккаунт{' '}
      <Text span inherit fw={600}>
        {USERNAME}
      </Text>{' '}
      удалится сразу: закладки, история чтения, настройки и сеансы.
    </>
  );

  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.DANGER}
      icon={TrashIcon}
      opened={opened}
      onClose={onClose}
      title="Удаление аккаунта"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Paper withBorder p="sm" radius="md">
            <Group gap="sm" wrap="nowrap">
              <Avatar name={USERNAME} color={PRIMARY_COLOR} variant="outline" size={32} />
              <Stack gap={0}>
                <Text fz="sm" fw={500}>
                  {USERNAME}
                </Text>
                <Text fz="xs" c="dimmed" ff="monospace">
                  webtoon@example.com
                </Text>
              </Stack>
            </Group>
          </Paper>
          <ModalMessage
            pattern={pattern}
            tone={MESSAGE_TONE.DANGER}
            icon={TrashIcon}
            main={main}
            details={['Восстановить его будет нельзя.']}
            current={
              <Text c="dimmed" fz={13}>
                {main} Восстановить его будет нельзя.
              </Text>
            }
          />
          <TextInput
            placeholder="Введите имя пользователя, чтобы подтвердить"
            leftSection={<UserIcon />}
            {...form.getInputProps('username')}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" color="red" leftSection={<TrashIcon />} disabled={!isConfirmed}>
              Удалить
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </PatternModal>
  );
}

export default DemoDeleteUserModal;
