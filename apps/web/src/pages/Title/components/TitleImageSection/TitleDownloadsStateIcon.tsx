import { RingProgress } from '@mantine/core';
import { CheckCircleIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { TITLE_DOWNLOADS_STATE, type TitleDownloadsState } from './models';

type Props = {
  state: TitleDownloadsState;
  progress: number;
};

const SIZE = 20;

/** Значок загрузок тайтла — те же знаки, что у строки главы. */
function TitleDownloadsStateIcon({ state, progress }: Props) {
  switch (state) {
    case TITLE_DOWNLOADS_STATE.DONE:
      return <CheckCircleIcon size={SIZE} weight="fill" color="var(--mantine-color-teal-filled)" />;
    case TITLE_DOWNLOADS_STATE.DOWNLOADING:
      return (
        <RingProgress
          size={SIZE + 2}
          thickness={2}
          roundCaps
          sections={[{ value: progress, color: 'var(--mantine-primary-color-filled)' }]}
        />
      );
    case TITLE_DOWNLOADS_STATE.PAUSED:
      return <PauseCircleIcon size={SIZE} color="var(--mantine-color-dimmed)" />;
    case TITLE_DOWNLOADS_STATE.FAILED:
      return (
        <WarningCircleIcon size={SIZE} weight="fill" color="var(--mantine-color-red-filled)" />
      );
  }
}

export default TitleDownloadsStateIcon;
