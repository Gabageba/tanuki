import type { MantineBreakpoint } from '@mantine/core';
import { Divider, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type useReaderFullscreen from '../../hooks/useReaderFullscreen';
import BookmarkMenuButton from '@/features/bookmark/BookmarkMenuButton';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
import ReaderNavigateButton from '../ReaderNavigateButton';
import ReaderChapterName from '../ReaderChapterName';
import type { Chapter, ChapterNumbering } from '@tanuki/contracts';
import ReaderPagesCount from '../ReaderPagesCount';
import ReaderSettingsButton from '../ReaderSettingsButton';
import ReaderFullscreenButton from '../ReaderFullscreenButton';
import ColorSchemeToggle from '@/shared/ui/ColorSchemeToggle';
import styles from '../../ReaderPage.module.scss';

type Props = {
  titleId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  page: number;
  pageEnd: number;
  fullscreen: ReturnType<typeof useReaderFullscreen>;
  pagesLength: number | null;
  chapters: Chapter[];
  numbering: ChapterNumbering;
  currentChapterIndex: number;
  visibleFrom?: MantineBreakpoint;
  hiddenFrom?: MantineBreakpoint;
};

function ReaderControls({
  page,
  pageEnd,
  fullscreen,
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
      {/* Главы нет в списке — её читают из другой ветки или список не загрузился: навигации по
      главам не на что опереться, а счётчик, закладка и настройки остаются. */}
      {currentChapter && (
        <>
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
          <Divider orientation="vertical" h={26} className={styles.divider} />
        </>
      )}
      <Group gap={innerGap} wrap="nowrap" style={{ flexShrink: 0 }}>
        <ReaderPagesCount
          pageEnd={pageEnd}
          page={page}
          pagesLength={pagesLength}
          visibleFrom="md"
        />
        <BookmarkMenuButton titleId={titleId} />
        <ReaderSettingsButton />
        <ColorSchemeToggle variant="subtle" color="gray" visibleFrom="md" />
        <ReaderFullscreenButton fullscreen={fullscreen} />
      </Group>
    </Group>
  );
}

export default ReaderControls;
