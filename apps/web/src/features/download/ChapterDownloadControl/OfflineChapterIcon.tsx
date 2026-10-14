import { Box, Tooltip } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Без сети у не скачанной главы — перечёркнутое облако (D2). */
function OfflineChapterIcon() {
  const { t } = useTranslation();

  return (
    <Tooltip label={t('chapterNotDownloadedCantOpenOffline')}>
      <Box c="dimmed" lh={0} px={6}>
        <CloudSlashIcon size={18} />
      </Box>
    </Tooltip>
  );
}

export default OfflineChapterIcon;
