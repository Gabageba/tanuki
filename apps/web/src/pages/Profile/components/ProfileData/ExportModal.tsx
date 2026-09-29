import { useState } from 'react';
import { Button, Modal, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { getExportFormatLabel } from './lib';
import { EXPORT_FORMAT, type ExportFormat } from './models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  opened: boolean;
  onClose: () => void;
};

/** Заглушка: закладок на сервере ещё нет, так что выгружать нечего — только выбор формата. */
function ExportModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>(EXPORT_FORMAT.JSON);

  const handleExport = () => {
    notifications.show({ message: t('willBeAvailableSoon') });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('bookmarksExport')} centered>
      <Stack>
        <SegmentedControl
          size="xs"
          value={format}
          onChange={(value) => setFormat(value as ExportFormat)}
          data={Object.values(EXPORT_FORMAT).map((value) => ({
            value,
            label: getExportFormatLabel(value),
          }))}
          styles={{
            label: {
              justifyContent: 'center',
            },
          }}
        />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<DownloadSimpleIcon />} onClick={handleExport}>
            {t('export')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </Modal>
  );
}

export default ExportModal;
