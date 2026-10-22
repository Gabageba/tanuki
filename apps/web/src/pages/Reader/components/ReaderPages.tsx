import { AppShell, Button, Center, EmptyState, Loader, Stack, Text } from '@mantine/core';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import type { ReaderSettings } from '@tanuki/contracts';
import { READER_READING_MODE } from '@tanuki/contracts';
import { ApiRequestError, isNotFoundError } from '@/shared/api/client';
import QueryError from '@/shared/ui/QueryError';
import ReaderChapterEnd from './ReaderChapterEnd';
import ReaderChapterUnavailable from './ReaderChapterUnavailable';
import ReaderNextChapterButton from './ReaderNextChapterButton';
import ReaderPageImage from './ReaderPageImage';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';
import useHorizontalReaderNavigation from '../hooks/useHorizontalReaderNavigation';
import { READER_CONTENT_MIN_HEIGHT } from '../lib';
import type { ReaderFeedChapter, ReaderPosition } from '../models';

type Props = {
  titleId: string;
  chapters: ReaderFeedChapter[];
  position: ReaderPosition;
  setPosition: (position: ReaderPosition) => void;
  prependChapter: (chapterId: string) => void;
  isPending: boolean;
  settings: ReaderSettings;
  registerPage: (element: HTMLElement | null) => (() => void) | undefined;
  onTap: () => void;
  /** Главу не открыть: без сети и не скачана. */
  isChapterUnavailable: (chapterId: string) => boolean;
};

/**
 * Лента глав: прочитанные остаются сверху, следующая подклеена снизу через отступ — он и есть
 * единственный признак того, что глава кончилась.
 *
 * Оба режима рисуют один и тот же список страниц: в горизонтальном лишние прячутся через
 * display: none, а не размонтируются. Иначе при каждом переключении режима <img> создавался бы
 * заново — уже загруженная страница моргала бы скелетоном и содержимое прыгало.
 */
function ReaderPages({
  titleId,
  chapters,
  position,
  setPosition,
  prependChapter,
  isPending,
  settings,
  registerPage,
  onTap,
  isChapterUnavailable,
}: Props) {
  const { t } = useTranslation();
  const isHorizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const { goNext, goPrev, isChapterEndShown } = useHorizontalReaderNavigation({
    enabled: isHorizontal,
    titleId,
    chapters,
    position,
    setPosition,
    prependChapter,
    autoNextChapter: settings.autoNextChapter,
    isChapterUnavailable,
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

  if (isPending) {
    return (
      <AppShell.Main>
        <ReaderPagesSkeleton containerWidth={settings.containerWidth} />
      </AppShell.Main>
    );
  }

  // Ни одной страницы, и хотя бы одна глава упала — это не пустая глава, а ошибка: показываем её
  // целиком, как на любой странице (404 — «не найдено», прочее — с повтором).
  const hasPages = chapters.some((chapter) => chapter.pages.length > 0);
  const failedChapter = chapters.find((chapter) => chapter.error);
  if (!hasPages && failedChapter?.error) {
    if (isChapterUnavailable(failedChapter.chapterId)) {
      return (
        <AppShell.Main>
          <ReaderChapterUnavailable />
        </AppShell.Main>
      );
    }
    return (
      <AppShell.Main>
        <QueryError error={failedChapter.error} onRetry={failedChapter.refetch} />
      </AppShell.Main>
    );
  }

  // Глава без страниц — это не всегда пустая глава: она может ещё грузиться или не загрузиться
  // вовсе, и то и другое показывает лента ниже. Показывать нечего ровно тогда, когда ни в одной
  // главе страниц нет и ждать больше нечего.
  const isFeedEmpty = chapters.every((chapter) => chapter.pages.length === 0 && !chapter.isPending);
  if (isFeedEmpty) {
    return (
      <AppShell.Main>
        <EmptyState title={t('pagesNotFound')} description={t('sourceReturnedNoPages')} />
      </AppShell.Main>
    );
  }

  // Следующая в ленте глава ещё не активна и прячется через display: none — при таком display
  // loading="lazy" не начинает скачивание, поэтому её первая страница осталась бы незагруженной
  // до самого перелистывания и на переходе моргала бы скелетоном. Грузим её заранее, как только
  // она появилась в ленте.
  const activeChapterIndex = chapters.findIndex(
    (chapter) => chapter.chapterId === position.chapterId,
  );
  const activeChapter = chapters[activeChapterIndex];

  const lastChapter = chapters[chapters.length - 1];

  /** Текст ошибки API уже переведён сервером; сбой на фронте показываем общим текстом. */
  const getErrorText = (error: Error | null) => (
    <Text c="dimmed" ta="center">
      {error instanceof ApiRequestError ? error.message : t('somethingWentWrong')}
    </Text>
  );

  // Следующая глава подклеивается сама, так что ручной переход нужен ровно там, где автоматический
  // не сработал: её не удалось загрузить. Главы нет вовсе (404) — переходить некуда, остаётся
  // только сказать об этом. Автоматический переход выключен — подклеивать нечего, лента кончается
  // экраном конца главы.
  const getFeedFooter = () => {
    if (!lastChapter) return null;

    // Подклеенная глава не загрузилась, потому что пропала сеть, — для читателя это та же не
    // скачанная следующая глава.
    if (lastChapter.isError && isChapterUnavailable(lastChapter.chapterId)) {
      return (
        <ReaderChapterEnd
          titleId={titleId}
          nextChapterId={lastChapter.chapterId}
          isNextUnavailable
        />
      );
    }

    if (lastChapter.isError) {
      return (
        <Stack gap="sm" align="center">
          {getErrorText(lastChapter.error)}
          {!isNotFoundError(lastChapter.error) && (
            <ReaderNextChapterButton titleId={titleId} chapterId={lastChapter.chapterId} />
          )}
        </Stack>
      );
    }

    if (lastChapter.isPending) return <Loader size="sm" />;
    const isNextUnavailable = Boolean(
      lastChapter.nextChapterId && isChapterUnavailable(lastChapter.nextChapterId),
    );
    if (!settings.autoNextChapter || isNextUnavailable) {
      return (
        <ReaderChapterEnd
          titleId={titleId}
          nextChapterId={lastChapter.nextChapterId}
          isNextUnavailable={isNextUnavailable}
        />
      );
    }
    if (!lastChapter.nextChapterId) return <Text c="dimmed">{t('thisIsLastChapter')}</Text>;

    return null;
  };

  // В горизонтальном режиме глава занимает весь экран одна, поэтому её загрузка и её ошибка — это
  // и есть весь экран. Уйти с упавшей главы некуда (адрес уже её), так что повтор запроса —
  // единственный выход, кроме 404: там повтор ответит тем же, и остаётся листать назад. Клик по
  // кнопке не должен заодно считаться тапом по зоне листания.
  const getActiveChapterPlaceholder = () => {
    if (!activeChapter?.isError) return <Loader size="sm" />;
    if (isChapterUnavailable(activeChapter.chapterId)) return <ReaderChapterUnavailable />;

    return (
      <Stack gap="sm" align="center">
        {getErrorText(activeChapter.error)}
        {!isNotFoundError(activeChapter.error) && (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              activeChapter.refetch();
            }}
            leftSection={<ArrowClockwiseIcon />}
          >
            {t('retry')}
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <AppShell.Main onClick={handleClick}>
      <Stack
        mih={READER_CONTENT_MIN_HEIGHT}
        align="center"
        justify={isHorizontal ? 'center' : undefined}
        gap={0}
      >
        {chapters.map((chapter, index) => (
          <Stack
            key={chapter.chapterId}
            w="100%"
            align="center"
            gap={isHorizontal ? 0 : settings.pageGap}
            mt={!isHorizontal && index > 0 ? settings.chapterGap : 0}
            pos={isHorizontal ? 'relative' : undefined}
            style={isHorizontal ? { overflow: 'hidden' } : undefined}
          >
            {chapter.pages.map((page) => (
              <ReaderPageImage
                key={page.index}
                ref={registerPage}
                page={page}
                chapterId={chapter.chapterId}
                settings={settings}
                hidden={
                  isHorizontal &&
                  (isChapterEndShown ||
                    !(
                      chapter.chapterId === position.chapterId && page.index === position.pageIndex
                    ))
                }
                eager={
                  chapter.chapterId === position.chapterId ||
                  (isHorizontal && index === activeChapterIndex + 1)
                }
                alt={t('pageOfTotal', { page: page.index + 1, total: chapter.pages.length })}
              />
            ))}
          </Stack>
        ))}

        {/* Горизонтальный переход в главу, которая ещё не догрузилась: показать нечего, но и
          пустым экран оставлять нельзя. */}
        {isHorizontal && activeChapter?.pages.length === 0 && (
          <Center py="xl">{getActiveChapterPlaceholder()}</Center>
        )}

        {isHorizontal && isChapterEndShown && activeChapter && (
          <Center py="xl">
            <ReaderChapterEnd
              titleId={titleId}
              nextChapterId={activeChapter.nextChapterId}
              isNextUnavailable={Boolean(
                activeChapter.nextChapterId && isChapterUnavailable(activeChapter.nextChapterId),
              )}
            />
          </Center>
        )}

        {!isHorizontal && <Center py="xl">{getFeedFooter()}</Center>}
      </Stack>
    </AppShell.Main>
  );
}

export default ReaderPages;
