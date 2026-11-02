import { ActionIcon, Tooltip } from '@mantine/core';
import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type useReaderFullscreen from '../hooks/useReaderFullscreen';

type Props = { fullscreen: ReturnType<typeof useReaderFullscreen> };

function ReaderFullscreenButton({ fullscreen }: Props) {
  const { t } = useTranslation();
  if (!fullscreen.supported) return null;
  const label = fullscreen.active ? t('exitFullScreen') : t('fullScreen');
  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label={label}
        aria-pressed={fullscreen.active}
        onClick={fullscreen.toggle}
      >
        {fullscreen.active ? <ArrowsInIcon /> : <ArrowsOutIcon />}
      </ActionIcon>
    </Tooltip>
  );
}

export default ReaderFullscreenButton;
