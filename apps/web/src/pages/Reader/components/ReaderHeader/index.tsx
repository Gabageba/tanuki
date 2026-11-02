import { AppShell, Group, Progress, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import type useReaderFullscreen from '../../hooks/useReaderFullscreen';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useSource from '@/entities/source/hooks/useSource';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import GoBackButton from '@/shared/ui/GoBackButton';
import ColorSchemeToggle from '@/shared/ui/ColorSchemeToggle';
import { ROUTE_PATHS, TITLE_TAB_SEARCH_PARAM, TITLE_TABS } from '@/shared/lib/routes';
import ReaderControls from '../ReaderControls';
import ReaderPagesCount from '../ReaderPagesCount';
import { TITLE_NAME_MIN_WIDTH } from '../../lib';
import ReaderHeaderSkeleton from './ReaderHeaderSkeleton';
import { isEmpty } from '@/shared/lib/isEmpty';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import { mergeQueries, toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import type { LoadingQuery } from '@/shared/ui/QueryBlock/models';

type Props = {
  titleId: string;
  /** Глава, которую читают прямо сейчас, — в ленте это не всегда та, с которой чтение начиналось. */
  chapterId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  page: number;
  pageEnd: number;
  fullscreen: ReturnType<typeof useReaderFullscreen>;
  pagesLength: number | null;
  /** Загрузка главы из ленты — от неё соседние главы. */
  feedQuery: LoadingQuery;
};

function ReaderHeader({
  titleId,
  chapterId,
  prevChapterId,
  nextChapterId,
  page,
  pageEnd,
  fullscreen,
  pagesLength,
  feedQuery,
}: Props) {
  const { t } = useTranslation();
  const titleQuery = useTitleDetails({ titleId });
  const chaptersQuery = useChapters({ titleId });
  const sourceQuery = useSource({ sourceId: titleQuery.data?.title.sourceId });
  const { data: titleData } = titleQuery;
  const { data: chaptersData } = chaptersQuery;
  const { data: source } = sourceQuery;
  // Шапка ждёт всё, но без названия, списка глав или источника обойдётся. Источник известен
  // только из тайтла: пока тайтла нет, ждём тайтл, а упавший тайтл источника уже не даст.
  // Перезапрос посреди чтения тихий (`isLive`): шапка не мигает скелетоном над читаемой главой.
  const { isSkeleton } = useSkeletonTiming({
    ...mergeQueries([
      toOptionalQuery(titleQuery),
      toOptionalQuery(chaptersQuery),
      toOptionalQuery(titleData ? sourceQuery : titleQuery),
      feedQuery,
    ]),
    isLive: true,
  });

  if (isSkeleton) {
    return <ReaderHeaderSkeleton fullscreen={fullscreen} />;
  }

  const chapters = chaptersData?.items ?? [];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const chapterProgress = pagesLength ? (pageEnd / pagesLength) * 100 : 0;

  // Вместо нижней границы шапки — полоса прогресса по текущей главе: трек занимает место бордера,
  // а заполнение растёт по мере чтения.
  return (
    <AppShell.Header withBorder={false}>
      <Group px="md" h="100%" gap="md" wrap="nowrap">
        <Group gap="xs" flex={1} miw={TITLE_NAME_MIN_WIDTH} wrap="nowrap">
          <GoBackButton
            path={`${generatePath(ROUTE_PATHS.TITLE, { titleId })}?${TITLE_TAB_SEARCH_PARAM}=${TITLE_TABS.CHAPTERS}`}
          />
          <Stack gap={4} miw={0}>
            {titleData && (
              <Title
                lh="tight"
                order={5}
                textWrap="nowrap"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {titleData?.title.name}
              </Title>
            )}
            <MidDotGroup
              truncate
              lh="tight"
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
        <ReaderPagesCount pageEnd={pageEnd} page={page} pagesLength={pagesLength} hiddenFrom="md" />
        <ColorSchemeToggle variant="subtle" color="gray" hiddenFrom="md" />
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
