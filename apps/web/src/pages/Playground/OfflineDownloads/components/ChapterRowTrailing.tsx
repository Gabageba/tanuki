import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { CloudSlashIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import {
  CHAPTER_ICON,
  DOWNLOAD_STATUS,
  OFFLINE_ROW,
  type ChapterAction,
  type ChapterIcon,
  type MockChapter,
  type OfflineRow,
} from '../models';
import { getDownloadStatusColor } from '../lib';
import ChapterMoreMenu from './ChapterMoreMenu';
import DownloadStatusControl from './DownloadStatusControl';

type Props = {
  chapter: MockChapter;
  variant: ChapterIcon;
  onAction: (action: ChapterAction) => void;
  /** Не скачанная глава без сети: вид по оси D. */
  unavailableRow?: OfflineRow;
  /** C2a — счётчик в цвете состояния, у ошибки он тоже виден. */
  isTinted?: boolean;
  /** C2e — значки в цветах C3. */
  isIconTinted?: boolean;
};

/** Что вариант оси C ставит в строке на место ↓. */
function ChapterRowTrailing({
  chapter,
  variant,
  onAction,
  unavailableRow,
  isTinted = false,
  isIconTinted = false,
}: Props) {
  if (unavailableRow === OFFLINE_ROW.DIMMED_ICON) {
    return (
      <Tooltip label="Глава не скачана — без сети не открыть">
        <Box c="dimmed" lh={0} px={6}>
          <CloudSlashIcon size={18} />
        </Box>
      </Tooltip>
    );
  }
  if (unavailableRow === OFFLINE_ROW.DIMMED) {
    return <Box w={28} />;
  }

  switch (variant) {
    case CHAPTER_ICON.LEGACY:
      return (
        <ActionIcon variant="subtle">
          <DownloadSimpleIcon />
        </ActionIcon>
      );
    case CHAPTER_ICON.BUTTON:
      return <DownloadStatusControl chapter={chapter} onAction={onAction} />;
    case CHAPTER_ICON.COUNTER:
      return (
        <Group gap={6} wrap="nowrap">
          {(chapter.status === DOWNLOAD_STATUS.DOWNLOADING ||
            (isTinted && chapter.status === DOWNLOAD_STATUS.FAILED)) && (
            <Text
              fz={12}
              c={(isTinted && getDownloadStatusColor(chapter.status)) || 'dimmed'}
              ff="monospace"
            >
              {chapter.pagesDone}/{chapter.pagesTotal}
            </Text>
          )}
          <DownloadStatusControl
            chapter={chapter}
            onAction={onAction}
            isIconTinted={isIconTinted}
          />
        </Group>
      );
    case CHAPTER_ICON.NUMBER_MARK:
      return <ChapterMoreMenu chapter={chapter} onAction={onAction} />;
    case CHAPTER_ICON.BAR:
      return <DownloadStatusControl chapter={chapter} onAction={onAction} isCancelCross />;
  }
}

export default ChapterRowTrailing;
