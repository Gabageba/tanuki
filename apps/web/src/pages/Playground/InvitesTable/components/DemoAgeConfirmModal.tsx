import { Button, Stack, Text } from '@mantine/core';
import { CheckIcon, EyeIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MESSAGE_TONE, type MessagePattern } from '../models';
import ModalMessage from './ModalMessage';
import PatternModal from './PatternModal';

type Props = {
  opened: boolean;
  pattern: MessagePattern;
  onClose: () => void;
};

/** Копия «Вам есть 18?» из настроек. */
function DemoAgeConfirmModal({ opened, pattern, onClose }: Props) {
  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.WARNING}
      icon={EyeIcon}
      opened={opened}
      onClose={onClose}
      title="Вам есть 18?"
      centered
    >
      <Stack gap="lg">
        <ModalMessage
          pattern={pattern}
          tone={MESSAGE_TONE.WARNING}
          icon={EyeIcon}
          main="Станут видны источники 18+ и тайтлы 18+ на обычных источниках без размытия."
          details={['Подтвердите, что вам исполнилось 18 лет.']}
          current={
            <Text fz={13}>
              Станут видны источники 18+ и тайтлы 18+ на обычных источниках без размытия.
              Подтвердите, что вам исполнилось 18 лет.
            </Text>
          }
        />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button leftSection={<CheckIcon />} onClick={onClose}>
            Мне есть 18
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </PatternModal>
  );
}

export default DemoAgeConfirmModal;
