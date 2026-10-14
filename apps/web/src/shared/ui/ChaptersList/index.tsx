import type { MantineStyleProps } from '@mantine/core';
import { Box, EmptyState, NavLink, ScrollArea } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  SORT_DIRECTION,
  type Chapter,
  type ChapterNumbering,
  type SortDirection,
} from '@tanuki/contracts';
import type { LinkedReadingMark, ReadingMark } from '@/entities/title/models';
import { getChapterReadStatus, getReaderPath } from '@/entities/title/readingProgress';
import ChapterItem from './ChapterItem';
import styles from './ChapterList.module.scss';

const CHAPTER_ESTIMATED_SIZE = 64;

type Props = {
  chapters: Chapter[];
  /** Как ветка нумерует главы: при нумерации по томам номер показывается вместе с томом. */
  numbering: ChapterNumbering;
  titleId: string;
  mah?: MantineStyleProps['mah'];
  showDate?: boolean;
  activeChapterId?: string;
  onChapterSelect?: () => void;
  /** Своя отметка в этом списке (resolveOwnMark): по ней красится прочитанное. */
  ownMark?: ReadingMark;
  /** Отметки других источников, перенесённые на главы этого списка (resolveLinkedMarks). */
  linkedMarks?: LinkedReadingMark[];
  /** Порядок, в котором пришли chapters: от него зависит, с какой стороны прочитанное. */
  direction?: SortDirection;
  /** Главы, вышедшие с прошлого визита: у узла — точка (N3). */
  newChapterIds?: ReadonlySet<string>;
  onMarkChapter?: (chapter: Chapter) => void;
  /** Что стоит в конце строки главы — например, состояние скачивания. */
  getChapterAction?: (chapter: Chapter) => ReactNode;
  /** Главы, которые сейчас не открыть (без сети и не скачаны): строка приглушена. */
  unavailableChapterIds?: ReadonlySet<string>;
};

const UNAVAILABLE_OPACITY = 0.45;

function ChaptersList({
  chapters,
  numbering,
  titleId,
  mah = '100%',
  showDate = false,
  activeChapterId,
  onChapterSelect,
  ownMark,
  linkedMarks = [],
  direction = SORT_DIRECTION.DESC,
  newChapterIds,
  onMarkChapter,
  getChapterAction,
  unavailableChapterIds,
}: Props) {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: chapters.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => CHAPTER_ESTIMATED_SIZE,
    overscan: 8,
  });

  const activeIndex = chapters.findIndex((chapter) => chapter.id === activeChapterId);

  useEffect(() => {
    if (activeIndex !== -1) {
      virtualizer.scrollToIndex(activeIndex, { align: 'center' });
    }
  }, [activeIndex, virtualizer]);

  const ownIndex = ownMark
    ? chapters.findIndex((chapter) => chapter.id === ownMark.chapter.id)
    : -1;

  const marksByChapterId = new Map<string, LinkedReadingMark[]>();
  for (const mark of linkedMarks) {
    marksByChapterId.set(mark.chapter.id, [...(marksByChapterId.get(mark.chapter.id) ?? []), mark]);
  }

  if (chapters.length === 0) {
    return (
      <EmptyState
        title={t('chaptersNotFound')}
        description={t('branchHasNoChaptersYet')}
        size="sm"
        icon={<EmptyIcon />}
        py="xs"
      />
    );
  }

  return (
    <ScrollArea.Autosize mah={mah} type="auto" viewportRef={viewportRef}>
      <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const chapter = chapters[virtualItem.index];
          if (!chapter) {
            return null;
          }

          // Глава с отметкой открывается там, где остановились, — иначе повторный вход начинал бы
          // её с первой страницы, а читалка тут же записала бы это начало поверх отметки.
          const isMarked = virtualItem.index === ownIndex;
          const pageIndex = isMarked && ownMark ? ownMark.pageIndex : 0;

          return (
            <Box
              key={chapter.id}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              pos="absolute"
              top={0}
              left={0}
              w="100%"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <NavLink
                className={styles.chapter}
                data-last={virtualItem.index === chapters.length - 1 || undefined}
                component={Link}
                to={getReaderPath(titleId, chapter.id, pageIndex)}
                opacity={unavailableChapterIds?.has(chapter.id) ? UNAVAILABLE_OPACITY : undefined}
                label={
                  <ChapterItem
                    chapter={chapter}
                    numbering={numbering}
                    showDate={showDate}
                    status={getChapterReadStatus(virtualItem.index, ownIndex, direction)}
                    isMarked={isMarked}
                    isNew={newChapterIds?.has(chapter.id) ?? false}
                    linkedMarks={marksByChapterId.get(chapter.id)}
                    withMarksSlot={linkedMarks.length > 0}
                    isReadBelow={direction === SORT_DIRECTION.DESC}
                    isFirst={virtualItem.index === 0}
                    isLast={virtualItem.index === chapters.length - 1}
                    onMark={onMarkChapter && (() => onMarkChapter(chapter))}
                    action={getChapterAction?.(chapter)}
                  />
                }
                onClick={onChapterSelect}
              />
            </Box>
          );
        })}
      </div>
    </ScrollArea.Autosize>
  );
}

export default ChaptersList;
