import { Group, Progress, Stack, Text } from '@mantine/core';
import type { ChaptersResponse, TitleReadingProgressResponse } from '@tanuki/contracts';
import {
  getChapterBranchId,
  resolveLinkedMarks,
  resolveOwnMark,
} from '@/entities/title/readingProgress';
import ContinueReadingButton from './ContinueReadingButton';
import OtherSourcesSplitButton from './OtherSourcesSplitButton';
import ReadFromStartButton from './ReadFromStartButton';

type Props = {
  titleId: string;
  progress: TitleReadingProgressResponse;
  /** Главы ветки своей отметки — от новых к старым. */
  chaptersData: ChaptersResponse;
};

/** Кнопка чтения по загруженным отметке и главам, под ней — докуда дочитано. */
function TitleReadingButtons({ titleId, progress, chaptersData }: Props) {
  const { items: chapters, numbering } = chaptersData;
  const ownMark = resolveOwnMark(progress, chapters, numbering);
  const firstChapter = chapters.at(-1);

  const { linked } = progress;
  const branchId = progress.own?.branchId ?? (firstChapter && getChapterBranchId(firstChapter));
  const linkedMarks = branchId ? resolveLinkedMarks(progress, chapters, branchId) : [];

  const mainButton = ownMark ? (
    <ContinueReadingButton titleId={titleId} mark={ownMark} numbering={numbering} />
  ) : (
    <ReadFromStartButton titleId={titleId} firstChapter={firstChapter} />
  );

  const chapterPosition =
    ownMark && chapters.length - chapters.findIndex((item) => item.id === ownMark.chapter.id);

  return (
    <Stack gap={8}>
      {linked.length > 0 ? (
        <OtherSourcesSplitButton
          titleId={titleId}
          linked={linked}
          linkedMarks={linkedMarks}
          numbering={numbering}
        >
          {mainButton}
        </OtherSourcesSplitButton>
      ) : (
        mainButton
      )}
      {chapterPosition !== undefined && (
        <Group gap={8}>
          <Progress value={(chapterPosition / chapters.length) * 100} size="sm" flex={1} />
          <Text fz={12} c="terracotta" ff="monospace">
            {chapterPosition} / {chapters.length}
          </Text>
        </Group>
      )}
    </Stack>
  );
}

export default TitleReadingButtons;
