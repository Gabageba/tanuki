import { Paper } from '@mantine/core';
import useChapters from '@/entities/title/hooks/useChapters';
import useChapterPages from '../hooks/useChapterPages';
import ReaderControls from './ReaderControls';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import styles from '../ReaderPage.module.scss';

const CONTROLS_OFFSET = 16;

type Props = {
  titleId: string;
  chapterId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  visible: boolean;
};

function ReaderMobileControls({
  titleId,
  chapterId,
  prevChapterId,
  nextChapterId,
  visible,
}: Props) {
  const { data: chaptersData } = useChapters({ titleId });
  const { data: chapterPages } = useChapterPages({ titleId, chapterId });

  const chapters = chaptersData?.items ?? [];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const pagesLength = chapterPages?.items.length ?? null;

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
      <ReaderControls
        pagesLength={pagesLength}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        titleId={titleId}
        chapters={chapters}
        currentChapterIndex={currentChapterIndex}
      />
    </Paper>
  );
}

export default ReaderMobileControls;
