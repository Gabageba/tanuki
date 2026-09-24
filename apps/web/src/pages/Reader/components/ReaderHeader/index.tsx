import { AppShell, Group, Progress, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useSource from '@/entities/source/hooks/useSource';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ReaderControls from '../ReaderControls';
import ReaderPagesCount from '../ReaderPagesCount';
import { TITLE_NAME_MIN_WIDTH } from '../../lib';
import ReaderHeaderSkeleton from './ReaderHeaderSkeleton';
import { isEmpty } from '@/shared/lib/isEmpty';

type Props = {
  titleId: string;
  /** Глава, которую читают прямо сейчас, — в ленте это не всегда та, с которой чтение начиналось. */
  chapterId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  page: number;
  pagesLength: number | null;
  isChapterDataPending: boolean;
};

function ReaderHeader({
  titleId,
  chapterId,
  prevChapterId,
  nextChapterId,
  page,
  pagesLength,
  isChapterDataPending,
}: Props) {
  const { t } = useTranslation();
  const { data: titleData, isPending: isTitleDetailsPending } = useTitleDetails({ titleId });
  const { data: chaptersData, isPending: isChaptersDataPending } = useChapters({ titleId });
  const { data: source, isPending: isSourcePending } = useSource({
    sourceId: titleData?.title.sourceId,
  });

  if (isTitleDetailsPending || isChaptersDataPending || isSourcePending || isChapterDataPending) {
    return <ReaderHeaderSkeleton />;
  }

  const chapters = chaptersData?.items ?? [];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const chapterProgress = pagesLength ? (page / pagesLength) * 100 : 0;

  // Вместо нижней границы шапки — полоса прогресса по текущей главе: трек занимает место бордера,
  // а заполнение растёт по мере чтения.
  return (
    <AppShell.Header withBorder={false}>
      <Group px="md" h="100%" gap="md" wrap="nowrap">
        <Group gap="xs" flex={1} miw={TITLE_NAME_MIN_WIDTH} wrap="nowrap">
          <GoBackButton path={generatePath(ROUTE_PATHS.TITLE, { titleId })} />
          <Stack gap={4} miw={0}>
            {titleData && (
              <Title
                lh={1}
                order={5}
                textWrap="nowrap"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {titleData?.title.name}
              </Title>
            )}
            <MidDotGroup
              truncate
              lh={1}
              gap={8}
              text={{
                fz: 12,
                c: 'dimmed',
              }}
              items={[
                currentChapterIndex !== -1 &&
                  !isEmpty(chaptersData?.items) &&
                  t('chapterOfTotal', {
                    number: chapters.length - currentChapterIndex,
                    total: chapters.length,
                  }),
                source?.title,
              ]}
            />
          </Stack>
        </Group>
        <ReaderPagesCount page={page} pagesLength={pagesLength} hiddenFrom="md" />
        <ReaderControls
          page={page}
          pagesLength={pagesLength}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          titleId={titleId}
          chapters={chapters}
          numbering={chaptersData?.numbering ?? CHAPTER_NUMBERING.GLOBAL}
          currentChapterIndex={currentChapterIndex}
          visibleFrom="md"
        />
      </Group>
      <Progress
        value={chapterProgress}
        size={2}
        radius={0}
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
      />
    </AppShell.Header>
  );
}

export default ReaderHeader;
