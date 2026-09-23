import type { MantineStyleProps } from '@mantine/core';
import { Box, EmptyState, NavLink, ScrollArea } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import { generatePath, Link } from 'react-router';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Chapter } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ChapterItem from './ChapterItem';
import styles from './ChapterList.module.scss';

const CHAPTER_ESTIMATED_SIZE = 64;

type Props = {
  chapters: Chapter[];
  titleId: string;
  mah?: MantineStyleProps['mah'];
  showDate?: boolean;
  activeChapterId?: string;
  onChapterSelect?: () => void;
};

function ChaptersList({
  chapters,
  titleId,
  mah = '100%',
  showDate = false,
  activeChapterId,
  onChapterSelect,
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

  if (chapters.length === 0) {
    <EmptyState description={t('branchHasNoChaptersYet')} size="sm" icon={<EmptyIcon />} py="xs" />;
  }

  return (
    <ScrollArea.Autosize mah={mah} type="auto" viewportRef={viewportRef}>
      <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const chapter = chapters[virtualItem.index];
          if (!chapter) {
            return null;
          }

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
                to={generatePath(ROUTE_PATHS.READER, { titleId, chapterId: chapter.id })}
                label={<ChapterItem chapter={chapter} showDate={showDate} />}
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
