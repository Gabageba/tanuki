import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BroomIcon } from '@phosphor-icons/react';
import { clearBrowserCache } from './lib';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

function ClearCacheModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    await clearBrowserCache(queryClient);
  };

  return (
    <ToneModal
      tone={MODAL_TONE.WARNING}
      icon={BroomIcon}
      opened={opened}
      onClose={onClose}
      title={t('clearBrowserCache')}
    >
      <Stack gap="md">
        <Stack gap={6}>
          <Text fz="sm">{t('resetsSavedPageDataAndReloads')}</Text>
          <Text c="dimmed" fz={13}>
            {t('signInAndSettingsWillRemain')}
          </Text>
        </Stack>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<BroomIcon />} loading={isClearing} onClick={handleClear}>
            {t('clear')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </ToneModal>
  );
}

export default ClearCacheModal;
