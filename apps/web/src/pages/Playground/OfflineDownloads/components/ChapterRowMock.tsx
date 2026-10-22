import { use } from 'react';
import { Box, Flex, Progress, Text } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { getMutedBackground } from '@/shared/lib/palette';
import { formatDateNumeric, getDownloadStatusColor } from '../lib';
import {
  CHAPTER_ICON,
  CHAPTER_TINT,
  DOWNLOAD_STATUS,
  type ChapterAction,
  type ChapterIcon,
  type ChapterTint,
  type MockChapter,
  type OfflineRow,
} from '../models';
import ChapterRowTrailing from './ChapterRowTrailing';
import NumberMark from './NumberMark';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  chapter: MockChapter;
  variant: ChapterIcon;
  onAction: (action: ChapterAction) => void;
  /** Без сети — вид не скачанной строки по оси D. */
  offlineRow?: OfflineRow;
  /** C2a/C2c/C2d — чем помечать состояние цветом. */
  tint?: ChapterTint;
};

/** Строка списка глав, как `ChapterItem` без линии прогресса чтения: номер, название, дата и
 *  справа то, что вариант оси C ставит на место ↓. */
function ChapterRowMock({ chapter, variant, onAction, offlineRow, tint }: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const isUnavailable = offlineRow !== undefined && chapter.status !== DOWNLOAD_STATUS.DONE;
  // Без сети скачанные строки и так выделены — цвет только онлайн.
  const color = offlineRow ? null : getDownloadStatusColor(chapter.status);

  return (
    <Box
      pos="relative"
      px="sm"
      className={`${styles.row}${isUnavailable ? ` ${styles.offlineRow}` : ''}`}
      bg={tint === CHAPTER_TINT.BACKGROUND && color ? getMutedBackground(color, true) : undefined}
      style={
        tint === CHAPTER_TINT.STRIPE && color
          ? { boxShadow: `inset 3px 0 0 var(--mantine-color-${color}-filled)` }
          : undefined
      }
    >
      <Flex justify="space-between" py="xs" wrap="nowrap" gap="xs" align="center">
        <Flex flex={1} miw={0} wrap="nowrap" gap="xs" align="center">
          <Text flex="none" ff="monospace">
            {chapter.number}
          </Text>
          {variant === CHAPTER_ICON.NUMBER_MARK && !isUnavailable && (
            <Flex flex="none" align="center">
              <NumberMark chapter={chapter} />
            </Flex>
          )}
          <Text flex={1} miw={0} truncate="end">
            {chapter.title}
          </Text>
        </Flex>
        <Flex flex="none" wrap="nowrap" gap="xs" align="center">
          {!isPhone && (
            <Text c="dimmed" fz={12} ff="monospace">
              {formatDateNumeric(chapter.date)}
            </Text>
          )}
          <ChapterRowTrailing
            chapter={chapter}
            variant={variant}
            onAction={onAction}
            unavailableRow={isUnavailable ? offlineRow : undefined}
            isTinted={tint === CHAPTER_TINT.COUNTER}
            isIconTinted={tint === CHAPTER_TINT.ICON}
          />
        </Flex>
      </Flex>
      {variant === CHAPTER_ICON.BAR && chapter.status === DOWNLOAD_STATUS.DOWNLOADING && (
        <Progress
          className={styles.rowBar}
          size={2}
          value={(chapter.pagesDone / chapter.pagesTotal) * 100}
        />
      )}
    </Box>
  );
}

export default ChapterRowMock;
