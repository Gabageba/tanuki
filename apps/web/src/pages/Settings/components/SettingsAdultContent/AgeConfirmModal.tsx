import { Button, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CheckIcon, EyeIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

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
    <ToneModal
      tone={MODAL_TONE.WARNING}
      icon={EyeIcon}
      opened={opened}
      onClose={onClose}
      title={t('areYou18')}
    >
      <Stack gap="md">
        <Stack gap={6}>
          <Text fz="sm">{description}</Text>
          <Text c="dimmed" fz={13}>
            {t('confirmYouAre18')}
          </Text>
        </Stack>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<CheckIcon />} onClick={onConfirm}>
            {t('iAm18')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </ToneModal>
  );
}

export default AgeConfirmModal;
