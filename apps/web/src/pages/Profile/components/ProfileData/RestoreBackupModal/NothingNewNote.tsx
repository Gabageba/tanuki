import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BackupPreview } from '@tanuki/contracts';
import { isAlreadyRestored } from './lib';

type Props = {
  preview: BackupPreview;
};

/** «Всё из копии уже есть» — повторное восстановление того же файла. «Восстановить» остаётся:
 *  оно может понадобиться ради настроек. */
function NothingNewNote({ preview }: Props) {
  const { t } = useTranslation();

  if (!isAlreadyRestored(preview)) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Text lh="tight" fz="sm">
        {t('everythingFromBackupAlreadyExists')}
      </Text>
      <Text lh="tight" c="dimmed" fz={13}>
        {t('restoreAddsNothingSettingsIfEnabled')}
      </Text>
    </Stack>
  );
}

export default NothingNewNote;
