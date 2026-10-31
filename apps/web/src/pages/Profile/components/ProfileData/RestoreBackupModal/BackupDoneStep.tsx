import { Button, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BookmarksSimpleIcon, XIcon } from '@phosphor-icons/react';
import type { BackupRestoreResult } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import BackupResultRows from './BackupResultRows';

type Props = {
  result: BackupRestoreResult;
  onClose: () => void;
  onOpenBookmarks: () => void;
};

/** Шаг «Готово»: что изменилось и что пропущено. */
function BackupDoneStep({ result, onClose, onOpenBookmarks }: Props) {
  const { t } = useTranslation();
  const { formatDateLong } = useDateFormat();

  return (
    <Stack gap="md">
      <Text lh="tight" fz="sm" style={{ overflowWrap: 'anywhere' }}>
        {t('backupOfUserFromRestored', {
          username: result.username,
          date: formatDateLong(result.exportedAt),
        })}
      </Text>
      <BackupResultRows result={result} />
      <ModalButtonsLayout>
        <Button variant="default" leftSection={<XIcon />} onClick={onClose}>
          {t('close')}
        </Button>
        <Button leftSection={<BookmarksSimpleIcon />} onClick={onOpenBookmarks}>
          {t('openBookmarks')}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default BackupDoneStep;
