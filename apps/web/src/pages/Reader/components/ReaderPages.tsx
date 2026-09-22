import { AppShell, Button, Center, EmptyState, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useChapterPages from '../hooks/useChapterPages';
import ReaderPageImage from './ReaderPageImage';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';

type Props = {
  titleId: string;
  chapterId: string;
};

function ReaderPages({ titleId, chapterId }: Props) {
  const { t } = useTranslation();
  const { data, isPending } = useChapterPages({ titleId, chapterId });

  if (isPending) {
    return <ReaderPagesSkeleton />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <AppShell.Main>
      <Stack mih="100vh" align="center">
        {data.items.map((page) => (
          <ReaderPageImage
            key={page.index}
            page={page}
            alt={t('pageOfTotal', { page: page.index + 1, total: data.items.length })}
          />
        ))}

        <Center py="xl">
          {data.nextChapterId ? (
            <Button
              component={Link}
              to={generatePath(ROUTE_PATHS.READER, { titleId, chapterId: data.nextChapterId })}
            >
              {t('nextChapter')}
            </Button>
          ) : (
            <Text c="dimmed">{t('thisIsLastChapter')}</Text>
          )}
        </Center>
      </Stack>
    </AppShell.Main>
  );
}

export default ReaderPages;
