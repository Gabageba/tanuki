import { useState } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BroomIcon } from '@phosphor-icons/react';
import { clearBrowserCache } from './lib';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

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
    <Modal opened={opened} onClose={onClose} title={t('clearBrowserCache')} centered>
      <Stack>
        <Text fz={13} c="dimmed">
          {t('resetsSavedPageDataAndReloads')}
        </Text>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<BroomIcon />} loading={isClearing} onClick={handleClear}>
            {t('clear')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </Modal>
  );
}

export default ClearCacheModal;
