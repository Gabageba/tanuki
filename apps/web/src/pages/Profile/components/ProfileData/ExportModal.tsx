import { useState } from 'react';
import { Button, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { getExportFormatLabel } from './lib';
import { EXPORT_FORMAT, type ExportFormat } from './models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

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
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={DownloadSimpleIcon}
      opened={opened}
      onClose={onClose}
      title={t('bookmarksExport')}
    >
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
    </ToneModal>
  );
}

export default ExportModal;
