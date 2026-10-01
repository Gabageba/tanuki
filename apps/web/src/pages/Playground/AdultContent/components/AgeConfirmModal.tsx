import { Button, Modal, Stack, Text } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Что станет видно — без него текст про главный тумблер, как в R/H/P. */
  reveals?: string;
};

/** M1: без подтверждения возраста контент 18+ не открывается (docs/09-legal.md). */
function AgeConfirmModal({ opened, onClose, onConfirm, reveals }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Вам есть 18?" centered>
      <Stack gap="lg">
        <Text fz="sm">
          {reveals
            ? `Станут видны ${reveals}. Подтвердите, что вам исполнилось 18 лет.`
            : 'Станут видны источники для взрослых, а откровенные тайтлы на обычных источниках перестанут размываться. Подтвердите, что вам исполнилось 18 лет.'}
        </Text>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button leftSection={<CheckIcon />} onClick={onConfirm}>
            Мне есть 18
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </Modal>
  );
}

export default AgeConfirmModal;
