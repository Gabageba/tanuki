import { useState, type MouseEvent, type ReactNode } from 'react';
import { Box, Flex, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { CircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from '@/shared/lib/isEmpty';
import { READING_MARK_CONFIDENCE, type Chapter, type ChapterNumbering } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import {
  CHAPTER_READ_STATUS,
  type ChapterReadStatus,
  type LinkedReadingMark,
} from '@/entities/title/models';
import { getShownVolume } from '@/entities/title/readingProgress';
import LinkedMarksIcon from './LinkedMarksIcon';
import ReadingMarkPopover from './ReadingMarkPopover';
import styles from './ChapterList.module.scss';

type Props = {
  chapter: Chapter;
  numbering: ChapterNumbering;
  showDate?: boolean;
  status?: ChapterReadStatus;
  /** Своя отметка стоит на этой главе. */
  isMarked?: boolean;
  /** Глава вышла с прошлого визита — точка у узла. */
  isNew?: boolean;
  /** Отметки других источников группы, перенесённые на эту главу, свежие первыми. */
  linkedMarks?: LinkedReadingMark[];
  /** Слот под иконку чужих отметок между линией и номером: есть, если отметки есть хоть где-то
   *  в списке, — тогда номера всех строк стоят одной колонкой. */
  withMarksSlot?: boolean;
  /** Прочитанные главы (более старые) лежат ниже — так при сортировке «сначала новые». */
  isReadBelow?: boolean;
  /** Крайние строки списка: линия за край не тянется. */
  isFirst?: boolean;
  isLast?: boolean;
  onMark?: () => void;
  /** Конец строки — например, состояние скачивания. Клики по нему строку не открывают сами. */
  action?: ReactNode;
};

const MARK_ICON_SIZE = 20;

/** Строка целиком — ссылка в читалку: клики по узлу, иконке отметок и скачиванию до неё доходить
 *  не должны. */
const stopRowClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

function ChapterItem({
  chapter,
  numbering,
  showDate = false,
  status = CHAPTER_READ_STATUS.UNREAD,
  isMarked = false,
  isNew = false,
  linkedMarks = [],
  withMarksSlot = false,
  isReadBelow = true,
  isFirst = false,
  isLast = false,
  onMark,
  action,
}: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();
  const [isPopoverOpened, setIsPopoverOpened] = useState(false);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);

  const areAllMarksApproximate =
    linkedMarks.length > 0 &&
    linkedMarks.every((mark) => mark.confidence === READING_MARK_CONFIDENCE.APPROXIMATE);

  const isEmptyNumber = isEmpty(chapter.number);
  const shownVolume = getShownVolume(chapter, numbering);
  const isEmptyTitle = isEmpty(chapter.title);

  // У текущей главы прочитана только сторона к более старым главам, у прочитанной — обе.
  const isOlderLineActive = status !== CHAPTER_READ_STATUS.UNREAD;
  const isNewerLineActive = status === CHAPTER_READ_STATUS.READ;
  const isTopLineActive = isReadBelow ? isNewerLineActive : isOlderLineActive;
  const isBottomLineActive = isReadBelow ? isOlderLineActive : isNewerLineActive;

  const isCircleActive = isMarked || status !== CHAPTER_READ_STATUS.UNREAD;

  const handleMark = (event: MouseEvent) => {
    stopRowClick(event);
    onMark?.();
  };

  const togglePopover = (event: MouseEvent) => {
    stopRowClick(event);
    setIsPopoverOpened((opened) => !opened);
  };

  const circle = (
    <CircleIcon
      size={18}
      // При наведении узел заранее залит — так он будет выглядеть после клика. Одной сменой цвета
      // не обойтись: прочитанный узел уже в акцентном цвете.
      weight={isMarked || isTimelineHovered ? 'fill' : 'bold'}
      className={styles.timelineNode}
      data-active={isCircleActive || undefined}
    />
  );
  // Своя отметка — в кольце акцентного цвета: рядом с иконками чужих её видно сразу.
  const ring = isMarked ? <Box className={styles.ownNode}>{circle}</Box> : circle;
  const node = isNew ? (
    <Box pos="relative" lh={0}>
      {ring}
      <Box className={styles.newDot} role="img" aria-label={t('hasNewChapters')} />
    </Box>
  ) : (
    ring
  );

  const timeline = (
    <Stack gap={4} align="center" flex={1}>
      <Box
        className={styles.timelineLine}
        data-active={isTopLineActive || undefined}
        data-hidden={isFirst || undefined}
      />
      {node}
      <Box
        className={styles.timelineLine}
        data-active={isBottomLineActive || undefined}
        data-hidden={isLast || undefined}
      />
    </Stack>
  );

  return (
    <Group align="stretch">
      {onMark ? (
        <UnstyledButton
          className={styles.chapterTimeline}
          data-markable
          onClick={handleMark}
          onMouseEnter={() => setIsTimelineHovered(true)}
          onMouseLeave={() => setIsTimelineHovered(false)}
        >
          {timeline}
        </UnstyledButton>
      ) : (
        <Box className={styles.chapterTimeline}>{timeline}</Box>
      )}
      {withMarksSlot && (
        <Flex w={MARK_ICON_SIZE} flex="none" align="center">
          {linkedMarks.length > 0 && (
            <>
              {/* Ветка от узла к иконке — через отступ строки; пунктир — все места примерные. */}
              <Box
                className={styles.markBranch}
                data-active={isOlderLineActive || undefined}
                data-approximate={areAllMarksApproximate || undefined}
              />
              <ReadingMarkPopover
                marks={linkedMarks}
                opened={isPopoverOpened}
                onChange={setIsPopoverOpened}
              >
                <UnstyledButton onClick={togglePopover}>
                  <LinkedMarksIcon marks={linkedMarks} size={MARK_ICON_SIZE} />
                </UnstyledButton>
              </ReadingMarkPopover>
            </>
          )}
        </Flex>
      )}
      <Flex
        justify="space-between"
        py="xs"
        flex={1}
        wrap="nowrap"
        miw={0}
        gap={{ base: 'xs', xs: 'md' }}
      >
        <Flex flex={1} miw={0} wrap="nowrap" gap={{ base: 'xs', xs: 'md' }} align="center">
          {!isEmptyNumber && (
            // Том и номер — отдельными кусками с зазором между ними: внутри куска пробел
            // моноширинного шрифта во всю клетку ужат, иначе «Т. 4» разваливается.
            <Flex flex="none" gap={{ base: 'xs', xs: 'md' }} wrap="nowrap">
              {shownVolume !== null && (
                <Text ff="monospace" style={{ wordSpacing: -5 }}>
                  {t('volumeNumberAbbrev', { volume: shownVolume })}
                </Text>
              )}
              <Text ff="monospace" style={{ wordSpacing: -5 }}>
                {t('chapterNumberAbbrev', { number: chapter.number })}
              </Text>
            </Flex>
          )}
          {!isEmptyTitle && (
            <Text flex={1} miw={0} truncate="end">
              {chapter.title}
            </Text>
          )}
          {isEmptyNumber && isEmptyTitle && <Text truncate="end">{t('untitled')}</Text>}
        </Flex>
        <Flex flex="none" wrap="nowrap" gap={{ base: 'xs', xs: 'md' }} align="center">
          {showDate && chapter.uploadedAt && (
            <Text c="dimmed" fz={12} ff="monospace">
              {formatDateNumeric(chapter.uploadedAt)}
            </Text>
          )}
          {action}
        </Flex>
      </Flex>
    </Group>
  );
}

export default ChapterItem;
