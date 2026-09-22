import { AppShell, Group, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';

import useChapters from '@/entities/title/hooks/useChapters';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useSource from '@/entities/source/hooks/useSource';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useChapterPages from '../hooks/useChapterPages';
import ReaderControls from './ReaderControls';
import ReaderPagesCount from './ReaderPagesCount';

const TITLE_MIN_WIDTH = 180;

type Props = {
  titleId: string;
  chapterId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
};

function ReaderHeader({ titleId, chapterId, prevChapterId, nextChapterId }: Props) {
  const { t } = useTranslation();
  const { data: titleData } = useTitleDetails({ titleId });
  const { data: chaptersData } = useChapters({ titleId });
  const { data: source } = useSource({ sourceId: titleData?.title.sourceId });
  const { data: chapterPages } = useChapterPages({ titleId, chapterId });

  const chapters = chaptersData?.items ?? [];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const pagesLength = chapterPages?.items.length ?? null;

  return (
    <AppShell.Header>
      <Group px="md" h="100%" gap="md" wrap="nowrap">
        <Group gap="xs" flex={1} miw={TITLE_MIN_WIDTH} wrap="nowrap">
          <GoBackButton path={generatePath(ROUTE_PATHS.TITLE, { titleId })} />
          <Stack gap={2} miw={0}>
            <Title
              lh={1}
              order={5}
              textWrap="nowrap"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {titleData?.title.name}
            </Title>
            <MidDotGroup
              truncate
              lh={1}
              gap={8}
              text={{
                fz: 12,
                c: 'dimmed',
              }}
              items={[
                t('chapterOfTotal', {
                  number: chapters.length - currentChapterIndex,
                  total: chapters.length,
                }),
                source?.title,
              ]}
            />
          </Stack>
        </Group>
        <ReaderPagesCount pagesLength={pagesLength} hiddenFrom="md" />
        <ReaderControls
          pagesLength={pagesLength}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          titleId={titleId}
          chapters={chapters}
          currentChapterIndex={currentChapterIndex}
          visibleFrom="md"
        />
      </Group>
    </AppShell.Header>
  );
}

export default ReaderHeader;
