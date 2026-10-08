import type { MantineBreakpoint } from '@mantine/core';
import { Divider, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import BookmarkMenuButton from '@/features/bookmark/BookmarkMenuButton';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
import ReaderNavigateButton from '../ReaderNavigateButton';
import ReaderChapterName from '../ReaderChapterName';
import type { Chapter, ChapterNumbering } from '@tanuki/contracts';
import ReaderPagesCount from '../ReaderPagesCount';
import ReaderSettingsButton from '../ReaderSettingsButton';
import styles from '../../ReaderPage.module.scss';

type Props = {
  titleId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  page: number;
  pagesLength: number | null;
  chapters: Chapter[];
  numbering: ChapterNumbering;
  currentChapterIndex: number;
  visibleFrom?: MantineBreakpoint;
  hiddenFrom?: MantineBreakpoint;
};

function ReaderControls({
  page,
  pagesLength,
  titleId,
  prevChapterId,
  nextChapterId,
  chapters,
  numbering,
  currentChapterIndex,
  visibleFrom,
  hiddenFrom,
}: Props) {
  const currentChapter = chapters[currentChapterIndex];
  const isXxs = useMediaQuery(XXS_QUERY, false);
  const outerGap = isXxs ? 'md' : 'xs';
  const innerGap = isXxs ? 'xs' : 4;

  return (
    <Group visibleFrom={visibleFrom} hiddenFrom={hiddenFrom} h="100%" gap={outerGap} wrap="nowrap">
      {currentChapter && (
        <Group gap={innerGap} miw={0} wrap="nowrap">
          <ReaderNavigateButton
            icon={<CaretLeftIcon />}
            titleId={titleId}
            chapterId={prevChapterId}
          />
          <ReaderChapterName
            currentChapter={currentChapter}
            chapters={chapters}
            numbering={numbering}
            titleId={titleId}
          />
          <ReaderNavigateButton
            icon={<CaretRightIcon />}
            titleId={titleId}
            chapterId={nextChapterId}
          />
        </Group>
      )}
      <Divider orientation="vertical" h={26} className={styles.divider} />
      <Group gap={innerGap} wrap="nowrap" style={{ flexShrink: 0 }}>
        <ReaderPagesCount page={page} pagesLength={pagesLength} visibleFrom="md" />
        <BookmarkMenuButton titleId={titleId} />
        <ReaderSettingsButton />
      </Group>
    </Group>
  );
}

export default ReaderControls;
