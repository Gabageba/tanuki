import type { MouseEvent } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  disabled: boolean;
  onDownload: (event: MouseEvent) => void;
};

/** ↓ — глава не скачана, клик ставит её в очередь. */
function DownloadChapterButton({ disabled, onDownload }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip label={t('downloadChapter')}>
      <ActionIcon
        aria-label={t('downloadChapter')}
        variant="subtle"
        disabled={disabled}
        onClick={onDownload}
      >
        <DownloadSimpleIcon />
      </ActionIcon>
    </Tooltip>
  );
}

export default DownloadChapterButton;
