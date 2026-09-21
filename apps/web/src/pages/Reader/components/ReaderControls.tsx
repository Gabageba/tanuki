import type { MantineBreakpoint } from '@mantine/core';
import { ActionIcon, Divider, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BookmarkSimpleIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
import ReaderNavigateButton from './ReaderNavigateButton';
import ReaderChapterName from './ReaderChapterName';
import type { Chapter } from '@tanuki/contracts';
import ReaderPagesCount from './ReaderPagesCount';
import ReaderSettingsButton from './ReaderSettingsButton';
import styles from '../ReaderPage.module.scss';

type Props = {
  titleId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  pagesLength: number | null;
  chapters: Chapter[];
  currentChapterIndex: number;
  visibleFrom?: MantineBreakpoint;
  hiddenFrom?: MantineBreakpoint;
};

function ReaderControls({
  pagesLength,
  titleId,
  prevChapterId,
  nextChapterId,
  chapters,
  currentChapterIndex,
  visibleFrom,
  hiddenFrom,
}: Props) {
  const currentChapter = chapters[currentChapterIndex];
  const isXxs = useMediaQuery(XXS_QUERY, false);
  const outerGap = isXxs ? 'md' : 'xs';
  const innerGap = isXxs ? 'xs' : 4;

  return (
    <Group visibleFrom={visibleFrom} hiddenFrom={hiddenFrom} h="100%" gap={outerGap}>
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
        <ReaderPagesCount pagesLength={pagesLength} visibleFrom="md" />
        <ActionIcon variant="subtle" color="gray" size="lg">
          <BookmarkSimpleIcon />
        </ActionIcon>
        <ReaderSettingsButton />
      </Group>
    </Group>
  );
}

export default ReaderControls;
