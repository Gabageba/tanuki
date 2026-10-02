import { Button, Stack, Text } from '@mantine/core';
import { BroomIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MESSAGE_TONE, type MessagePattern } from '../models';
import ModalMessage from './ModalMessage';
import PatternModal from './PatternModal';

type Props = {
  opened: boolean;
  pattern: MessagePattern;
  onClose: () => void;
};

/** Копия «Очистки кэша» из профиля — короткое подтверждение без полей. */
function DemoClearCacheModal({ opened, pattern, onClose }: Props) {
  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.WARNING}
      icon={BroomIcon}
      opened={opened}
      onClose={onClose}
      title="Очистить кэш браузера"
      centered
    >
      <Stack>
        <ModalMessage
          pattern={pattern}
          tone={MESSAGE_TONE.WARNING}
          icon={BroomIcon}
          main="Сбросит сохранённые данные страниц и перезагрузит приложение."
          details={['Вход и настройки сохранятся.']}
          current={
            <Text fz={13} c="dimmed">
              Сбросит сохранённые данные страниц и перезагрузит приложение. Вход и настройки
              сохранятся.
            </Text>
          }
        />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button leftSection={<BroomIcon />} onClick={onClose}>
            Очистить
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </PatternModal>
  );
}

export default DemoClearCacheModal;
