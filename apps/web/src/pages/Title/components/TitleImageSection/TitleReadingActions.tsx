import { Group, Progress, Stack, Text } from '@mantine/core';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import {
  getChapterBranchId,
  resolveLinkedMarks,
  resolveOwnMark,
} from '@/entities/title/readingProgress';
import ContinueReadingButton from './ContinueReadingButton';
import OtherSourcesSplitButton from './OtherSourcesSplitButton';
import ReadFromStartButton from './ReadFromStartButton';
import TitleReadingActionsSkeleton from './TitleReadingActionsSkeleton';

type Props = {
  titleId: string;
};

/**
 * «Продолжить» по своей отметке или «Читать с начала», если её нет. Главы берутся из ветки своей
 * отметки: там, где читали, и надо продолжать. Если читали и на других источниках группы, кнопка
 * становится split-кнопкой: под стрелкой — каждый источник, продолжить с его места. Переносить
 * чужую отметку сюда или нет, пользователь решает сам.
 */
function TitleReadingActions({ titleId }: Props) {
  const { data: progress, isPending: isProgressPending } = useReadingProgress({ titleId });
  // Ветка известна только из отметки: без неё запрос ушёл бы в ветку по умолчанию и тут же
  // повторился бы в нужную.
  const { data: chaptersData, isPending: isChaptersPending } = useChapters({
    titleId,
    branch: progress?.own?.branchId,
    enabled: !isProgressPending,
  });

  // «Продолжить» или «Читать с начала» решает отметка — до неё любая кнопка была бы догадкой и
  // сменилась бы на глазах.
  if (isProgressPending || isChaptersPending) {
    return <TitleReadingActionsSkeleton />;
  }

  // Главы приходят от новых к старым.
  const chapters = chaptersData?.items ?? [];
  const numbering = chaptersData?.numbering ?? CHAPTER_NUMBERING.GLOBAL;
  const ownMark = resolveOwnMark(progress, chapters, numbering);
  const firstChapter = chapters.at(-1);

  const linked = progress?.linked ?? [];
  const branchId = progress?.own?.branchId ?? (firstChapter && getChapterBranchId(firstChapter));
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

export default TitleReadingActions;
