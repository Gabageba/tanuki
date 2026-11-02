import { AppShell } from '@mantine/core';
import { useParams } from 'react-router';
import { DEFAULT_READER_SETTINGS, READER_READING_MODE } from '@tanuki/contracts';
import useUpdateReaderSettings from '@/entities/reader/hooks/useUpdateReaderSettings';
import useHorizontalReaderNavigation from './hooks/useHorizontalReaderNavigation';
import useReaderKeyboard from './hooks/useReaderKeyboard';
import useReaderFullscreen from './hooks/useReaderFullscreen';
import useReaderWakeLock from './hooks/useReaderWakeLock';
import { getReaderPageStep, getVisiblePageEnd } from './navigation';
import ReaderHeader from './components/ReaderHeader';
import ReaderMobileControls from './components/ReaderMobileControls';
import ReaderPages from './components/ReaderPages';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import useReaderFeed from './hooks/useReaderFeed';
import useReaderHeaderVisibility from './hooks/useReaderHeaderVisibility';
import useReaderSettings from '@/entities/reader/hooks/useReaderSettings';
import useRecordChapterRead from './hooks/useRecordChapterRead';
import useSaveReadingProgress from './hooks/useSaveReadingProgress';
import useTrackReadingTime from './hooks/useTrackReadingTime';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';

function Reader() {
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const settingsQuery = useReaderSettings();
  const { data: readerSettings } = settingsQuery;
  const settingsTiming = useSkeletonTiming(settingsQuery);
  const settingsReady = !settingsTiming.isSkeleton || settingsTiming.isOffline;
  const settings = readerSettings ?? DEFAULT_READER_SETTINGS;
  const pageStep = getReaderPageStep(settings);
  const updateSettings = useUpdateReaderSettings();
  const fullscreen = useReaderFullscreen();
  useReaderWakeLock(settings.keepScreenOn);
  const {
    chapters,
    activeChapter,
    position,
    setPosition,
    goToPosition,
    prependChapter,
    registerPage,
    isChapterUnavailable,
    isPinned,
    query: feedQuery,
  } = useReaderFeed({
    titleId,
    chapterId,
    readingMode: settings.readingMode,
    autoNextChapter: settingsReady && settings.autoNextChapter,
    pageStep,
    prefetchPages: settings.prefetchPages,
  });
  const { visible, toggle } = useReaderHeaderVisibility({
    ignoreScroll: isPinned,
    hideOnScroll: settings.hidePanelsOnScroll,
  });
  const navigation = useHorizontalReaderNavigation({
    enabled: settings.readingMode === READER_READING_MODE.HORIZONTAL,
    titleId,
    chapters,
    position,
    setPosition,
    prependChapter,
    autoNextChapter: settings.autoNextChapter,
    isChapterUnavailable,
    pageStep,
  });
  useReaderKeyboard({
    settings,
    activeChapter,
    pageStep,
    ...navigation,
    goToPosition: (target) => {
      navigation.resetEndScreen();
      goToPosition(target);
    },
    changeMode: () =>
      updateSettings.mutate({
        ...settings,
        readingMode:
          settings.readingMode === READER_READING_MODE.VERTICAL
            ? READER_READING_MODE.HORIZONTAL
            : READER_READING_MODE.VERTICAL,
      }),
    fullscreenSupported: fullscreen.supported,
    toggleFullscreen: fullscreen.toggle,
  });
  const pageTiming = useSkeletonTiming(activeChapter?.query ?? feedQuery);
  const contentReady = settingsReady && !pageTiming.isSkeleton;
  const validPosition = contentReady && activeChapter?.pages.length ? position : null;
  useSaveReadingProgress({ titleId, position: validPosition });

  // Шапка и контролы говорят о главе, которую читают прямо сейчас, а не о той, с которой чтение
  // начиналось: в ленте это разные главы, и адрес идёт следом за первой. Пока подклеенная глава
  // грузится, страниц у неё ещё нет — счётчик прячем, а не показываем «1 / 0».
  const pagesLength = activeChapter?.pages.length || null;
  const pageEnd = pagesLength
    ? getVisiblePageEnd(position.pageIndex, pagesLength, pageStep) + 1
    : position.pageIndex + 1;
  useRecordChapterRead({
    titleId,
    position: { ...position, pageIndex: pageEnd - 1 },
    pagesLength: contentReady ? pagesLength : null,
  });
  useTrackReadingTime();

  // offset: false — шапка не отодвигает контент, а лежит поверх него (она и так fixed). Иначе её
  // показ/скрытие меняло бы доступную высоту, а с ней и размер страницы в режиме «страница
  // целиком»: картинка масштабировалась бы на каждое переключение шапки.
  return (
    <AppShell header={{ height: HEADER_HEIGHT, collapsed: !visible, offset: false }}>
      <ReaderHeader
        titleId={titleId}
        chapterId={position.chapterId}
        prevChapterId={activeChapter?.prevChapterId ?? null}
        nextChapterId={activeChapter?.nextChapterId ?? null}
        page={position.pageIndex + 1}
        pageEnd={pageEnd}
        fullscreen={fullscreen}
        pagesLength={pagesLength}
        feedQuery={feedQuery}
      />
      <ReaderPages
        titleId={titleId}
        chapters={chapters}
        position={position}
        navigation={navigation}
        pageStep={pageStep}
        settings={settings}
        loading={!settingsReady}
        registerPage={registerPage}
        onTap={toggle}
        isChapterUnavailable={isChapterUnavailable}
      />
      <ReaderMobileControls
        titleId={titleId}
        chapterId={position.chapterId}
        prevChapterId={activeChapter?.prevChapterId ?? null}
        nextChapterId={activeChapter?.nextChapterId ?? null}
        page={position.pageIndex + 1}
        pageEnd={pageEnd}
        fullscreen={fullscreen}
        pagesLength={pagesLength}
        visible={visible}
        feedQuery={feedQuery}
      />
    </AppShell>
  );
}

export default Reader;
