import { AppShell, Box, Button, Center, EmptyState, Stack, Text } from '@mantine/core';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import type { PagesResponse, ReaderSettings } from '@tanuki/contracts';
import { READER_READING_MODE } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ReaderPageImage from './ReaderPageImage';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';
import useHorizontalReaderNavigation from '../hooks/useHorizontalReaderNavigation';
import { READER_CONTENT_MIN_HEIGHT } from '../lib';

type Props = {
  titleId: string;
  chapterId: string;
  chapterData?: PagesResponse;
  isChaptersDataPending: boolean;
  settings: ReaderSettings;
  onTap: () => void;
};

/**
 * Оба режима рисуют один и тот же список страниц: в горизонтальном лишние прячутся через
 * display: none, а не размонтируются. Иначе при каждом переключении режима <img> создавался бы
 * заново — уже загруженная страница моргала бы скелетоном и содержимое прыгало.
 */
function ReaderPages({
  titleId,
  chapterId,
  chapterData,
  isChaptersDataPending,
  settings,
  onTap,
}: Props) {
  const { t } = useTranslation();
  const isHorizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const pages = chapterData?.items ?? [];
  const { pageIndex, goNext, goPrev } = useHorizontalReaderNavigation({
    enabled: isHorizontal,
    titleId,
    chapterId,
    pagesCount: pages.length,
    prevChapterId: chapterData?.prevChapterId ?? null,
    nextChapterId: chapterData?.nextChapterId ?? null,
  });

  // В горизонтальном режиме экран делится на три зоны: края листают страницы, середина — тот же
  // тап по странице, что и в вертикальном, то есть прячет/возвращает шапку.
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!isHorizontal) {
      onTap();
      return;
    }

    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - left) / width;
    const tapZone = settings.tapZoneWidth / 100;
    if (ratio < tapZone) {
      goPrev();
    } else if (ratio > 1 - tapZone) {
      goNext();
    } else {
      onTap();
    }
  };

  if (isChaptersDataPending) {
    return (
      <AppShell.Main>
        <ReaderPagesSkeleton containerWidth={settings.containerWidth} />
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
    <AppShell.Main onClick={handleClick}>
      <Stack
        mih={READER_CONTENT_MIN_HEIGHT}
        align="center"
        justify={isHorizontal ? 'center' : undefined}
        gap={isHorizontal ? undefined : settings.pageGap}
      >
        {pages.map((page) => (
          // display: contents — обёртка нужна только чтобы прятать страницу, в раскладке её быть
          // не должно: скелетон и картинка остаются прямыми детьми Stack, как и без неё.
          <Box
            key={page.index}
            display={isHorizontal && page.index !== pageIndex ? 'none' : 'contents'}
          >
            <ReaderPageImage
              page={page}
              settings={settings}
              alt={t('pageOfTotal', { page: page.index + 1, total: pages.length })}
            />
          </Box>
        ))}

        {!isHorizontal && (
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
        )}
      </Stack>
    </AppShell.Main>
  );
}

export default ReaderPages;
