import { AppShell, Button, Center, EmptyState, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ReaderPageImage from './ReaderPageImage';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';
import { READER_CONTENT_MIN_HEIGHT } from '../lib';
import type { PagesResponse } from '@tanuki/contracts';

type Props = {
  titleId: string;
  chapterData?: PagesResponse;
  isChaptersDataPending: boolean;
  onTap: () => void;
};

function ReaderPages({ titleId, chapterData, isChaptersDataPending, onTap }: Props) {
  const { t } = useTranslation();

  if (isChaptersDataPending) {
    return (
      <AppShell.Main>
        <ReaderPagesSkeleton />
      </AppShell.Main>
    );
  }

  if (!chapterData) {
    return (
      <AppShell.Main>
        <EmptyState />
      </AppShell.Main>
    );
  }

  return (
    <AppShell.Main onClick={onTap}>
      <Stack mih={READER_CONTENT_MIN_HEIGHT} align="center">
        {chapterData.items.map((page) => (
          <ReaderPageImage
            key={page.index}
            page={page}
            alt={t('pageOfTotal', { page: page.index + 1, total: chapterData.items.length })}
          />
        ))}

        <Center py="xl">
          {chapterData.nextChapterId ? (
            <Button
              component={Link}
              to={generatePath(ROUTE_PATHS.READER, {
                titleId,
                chapterId: chapterData.nextChapterId,
              })}
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
