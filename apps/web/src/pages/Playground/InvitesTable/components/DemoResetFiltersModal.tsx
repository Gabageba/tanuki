import { Button, Checkbox, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FunnelXIcon } from '@phosphor-icons/react';
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
  rememberChoice: boolean;
};

/** Копия «Сбросить другие фильтры?» из каталога — без пояснений, только главная фраза. */
function DemoResetFiltersModal({ opened, pattern, onClose }: Props) {
  const form = useForm<FormValues>({ initialValues: { rememberChoice: false } });
  const handleSubmit = form.onSubmit(onClose);
  const main =
    'Источник не умеет сочетать эти фильтры между собой — выбор «Завершён» сбросит остальные.';

  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.WARNING}
      icon={FunnelXIcon}
      opened={opened}
      onClose={onClose}
      title="Сбросить другие фильтры?"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <ModalMessage
            pattern={pattern}
            tone={MESSAGE_TONE.WARNING}
            icon={FunnelXIcon}
            main={main}
            current={<Text size="sm">{main}</Text>}
          />
          <Checkbox
            label="Больше не спрашивать"
            {...form.getInputProps('rememberChoice', { type: 'checkbox' })}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" leftSection={<FunnelXIcon />}>
              Заменить
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </PatternModal>
  );
}

export default DemoResetFiltersModal;
