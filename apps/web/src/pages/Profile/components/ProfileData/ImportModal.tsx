import { useState } from 'react';
import { Button, FileInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { FileIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import ProgressList from '@/shared/ui/ProgressList';
import { getMockBookmarkStatusLabel } from './lib';
import { MOCK_IMPORT_PREVIEW } from './models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const MOCK_TOTAL = MOCK_IMPORT_PREVIEW.reduce((total, { count }) => total + count, 0);

/** Заглушка: файл не читается — после выбора показывается макет того, что нашлось бы в нём. */
function ImportModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  const handleImport = () => {
    notifications.show({ message: t('willBeAvailableSoon') });
    handleClose();
  };

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={UploadSimpleIcon}
      opened={opened}
      onClose={handleClose}
      title={t('bookmarksImport')}
    >
      <Stack>
        <Text fz={13} c="dimmed">
          {t('importDoesNotOverwriteProgress')}
        </Text>
        <FileInput
          placeholder="tanuki-export.json"
          accept="application/json,.json"
          leftSection={<FileIcon />}
          value={file}
          onChange={setFile}
          clearable
        />
        {file && (
          <Stack gap="sm">
            <Text fw={500}>{t('foundCountTitles', { count: MOCK_TOTAL })}</Text>
            <ProgressList
              gap="xs"
              items={MOCK_IMPORT_PREVIEW.map(({ status, count }) => ({
                key: status,
                label: getMockBookmarkStatusLabel(status, t),
                value: count,
                text: (
                  <Text ff="monospace" fz="sm">
                    {count}
                  </Text>
                ),
              }))}
            />
          </Stack>
        )}

        <ModalButtonsLayout>
          <Button variant="default" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button leftSection={<UploadSimpleIcon />} disabled={!file} onClick={handleImport}>
            {t('import')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </ToneModal>
  );
}

export default ImportModal;
