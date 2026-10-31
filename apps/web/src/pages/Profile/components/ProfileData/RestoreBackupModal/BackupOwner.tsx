import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BackupPreview } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  preview: BackupPreview;
};

/** Длинные логин и адрес переносятся, а не обрезаются. */
const WRAP_ANYWHERE = { overflowWrap: 'anywhere' } as const;

/** Чья копия и откуда — главной фразой над счётчиками сводки. */
function BackupOwner({ preview }: Props) {
  const { t } = useTranslation();
  const { formatDateLong } = useDateFormat();

  return (
    <Stack gap={4}>
      <Text lh="tight" fz="sm" style={WRAP_ANYWHERE}>
        {t('backupOfUserFrom', {
          username: preview.username,
          date: formatDateLong(preview.exportedAt),
        })}
      </Text>
      <Text lh="tight" c="dimmed" fz={13} ff="monospace" style={WRAP_ANYWHERE}>
        {preview.origin}
      </Text>
    </Stack>
  );
}

export default BackupOwner;
