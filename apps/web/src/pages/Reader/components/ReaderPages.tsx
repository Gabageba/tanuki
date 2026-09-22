import { AppShell, Button, Center, EmptyState, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useChapterPages from '../hooks/useChapterPages';
import ReaderPageImage from './ReaderPageImage';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import { READER_CONTENT_MIN_HEIGHT } from '../lib';

type Props = {
  titleId: string;
  chapterId: string;
  onTap: () => void;
};

function ReaderPages({ titleId, chapterId, onTap }: Props) {
  const { t } = useTranslation();
  const { data, isPending } = useChapterPages({ titleId, chapterId });

  if (isPending) {
    return <ReaderPagesSkeleton />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <AppShell.Main onClick={onTap}>
      <Stack mih={READER_CONTENT_MIN_HEIGHT} align="center" mt={HEADER_HEIGHT}>
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
