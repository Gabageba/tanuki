import type { ReactNode } from 'react';
import { Box, Flex, Group, Stack, Text } from '@mantine/core';
import { CircleIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, type Chapter } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { CHAPTER_READ_STATUS } from '@/entities/title/models';
import { getChapterReadStatus } from '@/entities/title/readingProgress';
import type { DemoState } from '../models';
import { getChapterIndex, getChapterLabel } from '../lib';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
  chapter: Chapter;
  index: number;
  /** Узел на линии своего прогресса; по умолчанию — круг, залитый на своей отметке. */
  node?: ReactNode;
  /** Поверх круга, в его углу, — стопка макета A3. */
  nodeBadge?: ReactNode;
  /** Ширина колонки таймлайна: узел шире круга не должен сдвигать линию между строками. */
  timelineWidth?: number;
  /** Вся левая колонка целиком — для дорожек макета E. */
  timeline?: ReactNode;
  /** Слева от таймлайна — колонка стопок макета A4. */
  gutter?: ReactNode;
  /** Между таймлайном и номером главы. */
  leading?: ReactNode;
  /** Сразу после названия главы. */
  trailing?: ReactNode;
  /** Вместо даты загрузки — макет K. */
  meta?: ReactNode;
  /** Вторая строка под номером и названием — макет G. */
  below?: ReactNode;
};

/** Строка главы — как в ChaptersList, но без ссылки и виртуализации: узел и хвост задаёт макет. */
function DemoChapterRow({
  demo,
  chapter,
  index,
  node,
  nodeBadge,
  timelineWidth = 18,
  timeline,
  gutter,
  leading,
  trailing,
  meta,
  below,
}: Props) {
  const { formatDateNumeric } = useDateFormat();

  const ownIndex = getChapterIndex(demo, demo.own?.chapter);
  const status = getChapterReadStatus(index, ownIndex, demo.direction);
  const isReadBelow = demo.direction === SORT_DIRECTION.DESC;
  const isOlderLineActive = status !== CHAPTER_READ_STATUS.UNREAD;
  const isNewerLineActive = status === CHAPTER_READ_STATUS.READ;
  const isMarked = status === CHAPTER_READ_STATUS.CURRENT;

  return (
    <Group
      align="stretch"
      wrap="nowrap"
      gap="sm"
      className={styles.row}
      data-chapter-id={chapter.id}
      data-highlighted={demo.highlightedChapterId === chapter.id || undefined}
    >
      {gutter}
      {timeline ?? (
        <Stack gap={4} align="center" w={timelineWidth} flex="none">
          <Box
            className={styles.timelineLine}
            data-active={(isReadBelow ? isNewerLineActive : isOlderLineActive) || undefined}
          />
          {node ?? (
            <Box pos="relative" h={18}>
              <CircleIcon
                size={18}
                weight={isMarked ? 'fill' : 'bold'}
                color={
                  status === CHAPTER_READ_STATUS.UNREAD
                    ? 'var(--mantine-color-default-border)'
                    : 'var(--mantine-primary-color-filled)'
                }
              />
              {nodeBadge}
            </Box>
          )}
          <Box
            className={styles.timelineLine}
            data-active={(isReadBelow ? isOlderLineActive : isNewerLineActive) || undefined}
          />
        </Stack>
      )}
      {leading}
      <Stack flex={1} miw={0} py="xs" gap={2} justify="center">
        <Flex gap="xs" align="center" wrap="nowrap">
          <Text flex="none" ff="monospace">
            {getChapterLabel(chapter)}
          </Text>
          <Text flex={1} miw={0} truncate="end">
            {chapter.title}
          </Text>
          {trailing}
          {meta ??
            (chapter.uploadedAt && (
              <Text c="dimmed" fz={12} ff="monospace" flex="none" visibleFrom="xs">
                {formatDateNumeric(chapter.uploadedAt)}
              </Text>
            ))}
        </Flex>
        {below}
      </Stack>
    </Group>
  );
}

export default DemoChapterRow;
