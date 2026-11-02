import { Paper } from '@mantine/core';
import type useReaderFullscreen from '../hooks/useReaderFullscreen';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import ReaderControls from './ReaderControls';
import ReaderControlsSkeleton from './ReaderControls/ReaderControlsSkeleton';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import { mergeQueries, toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import type { LoadingQuery } from '@/shared/ui/QueryBlock/models';
import styles from '../ReaderPage.module.scss';

const CONTROLS_OFFSET = 16;

type Props = {
  titleId: string;
  chapterId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  page: number;
  pageEnd: number;
  fullscreen: ReturnType<typeof useReaderFullscreen>;
  pagesLength: number | null;
  visible: boolean;
  /** Загрузка главы из ленты — от неё соседние главы. */
  feedQuery: LoadingQuery;
};

function ReaderMobileControls({
  titleId,
  chapterId,
  prevChapterId,
  nextChapterId,
  page,
  pageEnd,
  fullscreen,
  pagesLength,
  visible,
  feedQuery,
}: Props) {
  const chaptersQuery = useChapters({ titleId });
  const { data: chaptersData } = chaptersQuery;
  // Как у шапки: без списка глав панель обойдётся, перезапрос посреди чтения тихий.
  const { isSkeleton } = useSkeletonTiming({
    ...mergeQueries([toOptionalQuery(chaptersQuery), feedQuery]),
    isLive: true,
  });

  const chapters = chaptersData?.items ?? [];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);

  return (
    <Paper
      withBorder
      h={HEADER_HEIGHT}
      hiddenFrom="md"
      w="fit-content"
      maw={`calc(100% - ${CONTROLS_OFFSET * 2}px)`}
      px="md"
      bg="var(--mantine-color-body)"
      pos="fixed"
      bottom={CONTROLS_OFFSET}
      left={0}
      right={0}
      className={
        visible ? styles.mobileControls : `${styles.mobileControls} ${styles.mobileControlsHidden}`
      }
      style={{ marginInline: 'auto' }}
    >
      {isSkeleton ? (
        <ReaderControlsSkeleton fullscreen={fullscreen} />
      ) : (
        <ReaderControls
          pageEnd={pageEnd}
          fullscreen={fullscreen}
          page={page}
          pagesLength={pagesLength}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          titleId={titleId}
          chapters={chapters}
          numbering={chaptersData?.numbering ?? CHAPTER_NUMBERING.GLOBAL}
          currentChapterIndex={currentChapterIndex}
        />
      )}
    </Paper>
  );
}

export default ReaderMobileControls;
