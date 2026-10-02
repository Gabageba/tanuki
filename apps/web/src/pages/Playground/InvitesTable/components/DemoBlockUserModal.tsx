import { Button, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ChatTextIcon, ClockIcon, ProhibitIcon } from '@phosphor-icons/react';
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
  duration: string;
  reason: string;
};

const USERNAME = 'webtoon_guy';

/** Копия «Блокировки» из «Управления» — модалка с полями. */
function DemoBlockUserModal({ opened, pattern, onClose }: Props) {
  const form = useForm<FormValues>({ initialValues: { duration: 'week', reason: '' } });
  const handleSubmit = form.onSubmit(onClose);
  const username = (
    <Text span inherit fw={600}>
      {USERNAME}
    </Text>
  );

  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.DANGER}
      icon={ProhibitIcon}
      opened={opened}
      onClose={onClose}
      title="Блокировка"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <ModalMessage
            pattern={pattern}
            tone={MESSAGE_TONE.DANGER}
            icon={ProhibitIcon}
            main={
              <>
                {username} не сможет войти, пока блокировка не закончится. Все сеансы этого аккаунта
                завершатся сразу.
              </>
            }
            details={[
              'Причину, если укажете, увидят персонал в таблице и сам пользователь при попытке войти',
            ]}
            current={
              <>
                <Text c="dimmed" fz={13}>
                  {username} не сможет войти, пока блокировка не закончится. Все сеансы этого
                  аккаунта завершатся сразу.
                </Text>
                <Text c="dimmed" fz={13}>
                  Причину, если укажете, увидят персонал в таблице и сам пользователь при попытке
                  войти
                </Text>
              </>
            }
          />
          <Select
            aria-label="Срок"
            leftSection={<ClockIcon />}
            allowDeselect={false}
            data={[
              { value: 'day', label: '1 день' },
              { value: 'week', label: '7 дней' },
              { value: 'month', label: '30 дней' },
              { value: 'forever', label: 'Навсегда' },
            ]}
            {...form.getInputProps('duration')}
          />
          <TextInput
            placeholder="Причина"
            leftSection={<ChatTextIcon />}
            {...form.getInputProps('reason')}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" color="red" leftSection={<ProhibitIcon />}>
              Заблокировать
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </PatternModal>
  );
}

export default DemoBlockUserModal;
