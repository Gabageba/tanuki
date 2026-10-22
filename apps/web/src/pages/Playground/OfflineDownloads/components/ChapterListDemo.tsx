import { Button, Paper, Stack } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import useDownloadSimulation from '../hooks/useDownloadSimulation';
import type { ChapterIcon, ChapterTint, MockChapter, OfflineRow } from '../models';
import ChapterRowMock from './ChapterRowMock';

type Props = {
  chapters: MockChapter[];
  variant: ChapterIcon;
  offlineRow?: OfflineRow;
  tint?: ChapterTint;
  /** Кнопка «вернуть как было» — только в живых списках. */
  withReset?: boolean;
};

/** Живой список глав: иконки нажимаются, очередь качает по одной главе. */
function ChapterListDemo({
  chapters: initialChapters,
  variant,
  offlineRow,
  tint,
  withReset = false,
}: Props) {
  const { chapters, handleAction, reset } = useDownloadSimulation(initialChapters);

  return (
    <Stack gap="xs">
      <Paper withBorder radius="md" p={4}>
        {chapters.map((chapter) => (
          <ChapterRowMock
            key={chapter.id}
            chapter={chapter}
            variant={variant}
            offlineRow={offlineRow}
            tint={tint}
            onAction={(action) => handleAction(chapter.id, action)}
          />
        ))}
      </Paper>
      {withReset && (
        <SandboxOnly>
          <Button
            variant="default"
            size="xs"
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={reset}
          >
            Вернуть состояния глав
          </Button>
        </SandboxOnly>
      )}
    </Stack>
  );
}

export default ChapterListDemo;
