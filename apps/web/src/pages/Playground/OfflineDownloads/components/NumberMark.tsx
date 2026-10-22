import { RingProgress } from '@mantine/core';
import { CheckCircleIcon, ClockIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { DOWNLOAD_STATUS, type MockChapter } from '../models';

type Props = {
  chapter: MockChapter;
};

const SIZE = 14;

/** C3 — значок состояния у номера главы; у не скачанной ничего нет. */
function NumberMark({ chapter }: Props) {
  switch (chapter.status) {
    case DOWNLOAD_STATUS.DONE:
      return (
        <CheckCircleIcon
          size={SIZE}
          weight="fill"
          color="var(--mantine-color-teal-filled)"
          aria-label="Скачана"
        />
      );
    case DOWNLOAD_STATUS.QUEUED:
      return <ClockIcon size={SIZE} color="var(--mantine-color-dimmed)" aria-label="В очереди" />;
    case DOWNLOAD_STATUS.DOWNLOADING:
      return (
        <RingProgress
          size={SIZE + 2}
          thickness={2}
          sections={[
            {
              value: (chapter.pagesDone / chapter.pagesTotal) * 100,
              color: 'var(--mantine-primary-color-filled)',
            },
          ]}
        />
      );
    case DOWNLOAD_STATUS.FAILED:
      return (
        <WarningCircleIcon
          size={SIZE}
          weight="fill"
          color="var(--mantine-color-red-filled)"
          aria-label="Ошибка"
        />
      );
    case null:
      return null;
  }
}

export default NumberMark;
