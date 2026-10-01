import { Button, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  opened: boolean;
  /** Что станет видно после подтверждения — целой фразой. */
  description: string;
  onConfirm: () => void;
  onClose: () => void;
};

function AgeConfirmModal({ opened, description, onConfirm, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onClose} title={t('areYou18')} centered>
      <Stack gap="lg">
        <Text fz={13}>{description}</Text>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<CheckIcon />} onClick={onConfirm}>
            {t('iAm18')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </Modal>
  );
}

export default AgeConfirmModal;
