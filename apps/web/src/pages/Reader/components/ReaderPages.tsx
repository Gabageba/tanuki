import { AppShell, Box, Center, Stack } from '@mantine/core';
import { READER_DIRECTION, READER_READING_MODE, type ReaderSettings } from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import type useHorizontalReaderNavigation from '../hooks/useHorizontalReaderNavigation';
import useReaderPageWindow from '../hooks/useReaderPageWindow';
import useReaderPrefetch from '../hooks/useReaderPrefetch';
import useReaderGestures from '../hooks/useReaderGestures';
import ReaderChapterEnd from './ReaderChapterEnd';
import ReaderChapterUnavailable from './ReaderChapterUnavailable';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';
import ReaderVerticalChapter from './ReaderVerticalChapter';
import ReaderSpread from './ReaderSpread';
import ReaderFeedFooter from './ReaderFeedFooter';

type Props = {
  titleId: string;
  chapters: ReaderFeedChapter[];
  position: ReaderPosition;
  settings: ReaderSettings;
  pageStep: number;
  loading: boolean;
  navigation: ReturnType<typeof useHorizontalReaderNavigation>;
  registerPage: (element: HTMLElement | null) => (() => void) | undefined;
  onTap: () => void;
  onZoomChange: (zoomed: boolean) => void;
  isChapterUnavailable: (chapterId: string) => boolean;
};

function ReaderPages({
  titleId,
  chapters,
  position,
  settings,
  pageStep,
  loading,
  navigation,
  registerPage,
  onTap,
  onZoomChange,
  isChapterUnavailable,
}: Props) {
  const horizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const activeChapter = chapters.find((chapter) => chapter.chapterId === position.chapterId);
  const activeIndex = chapters.findIndex((chapter) => chapter.chapterId === position.chapterId);
  const displayedChapters = settings.autoNextChapter
    ? chapters
    : chapters.slice(0, activeIndex + 1);
  const pageWindow = useReaderPageWindow({
    chapters: displayedChapters,
    position,
    horizontal,
    pageStep,
    registerPage,
  });
  const loaded = useReaderPrefetch({
    chapters,
    position,
    count: loading ? 0 : settings.prefetchPages,
    autoNextChapter: settings.autoNextChapter,
    visible: pageWindow.visible,
  });
  const rtl = settings.direction === READER_DIRECTION.RTL;
  const activeKey = `${position.chapterId}#${position.pageIndex}`;
  const { bindings, contentRef, viewportRef, touchAction } = useReaderGestures({
    horizontal,
    positionKey: `${horizontal}:${pageStep}:${activeKey}`,
    onLeft: rtl ? navigation.goNext : navigation.goPrev,
    onRight: rtl ? navigation.goPrev : navigation.goNext,
    onTap,
    onZoomChange,
    tapZoneWidth: settings.tapZoneWidth,
  });
  const mainChapter = horizontal
    ? activeChapter
    : (chapters.find((chapter) => chapter.pages.length > 0) ?? activeChapter);
  if (!mainChapter) return null;
  if (loading)
    return (
      <AppShell.Main bg="var(--mantine-color-body)">
        <ReaderPagesSkeleton
          containerWidth={settings.containerWidth}
          horizontal={horizontal}
          pageStep={pageStep}
        />
      </AppShell.Main>
    );

  return (
    <AppShell.Main
      bg="var(--mantine-color-body)"
      ref={viewportRef}
      {...bindings}
      style={{ touchAction, overflow: 'clip' }}
    >
      <PageLayout.Content
        fluid
        query={horizontal ? mainChapter.query : { ...mainChapter.query, isLive: true }}
        skeleton={
          <ReaderPagesSkeleton
            containerWidth={settings.containerWidth}
            horizontal={horizontal}
            pageStep={pageStep}
          />
        }
        offline={<ReaderChapterUnavailable />}
      >
        <Box
          ref={contentRef}
          style={{ transform: 'translate(0px, 0px) scale(1)', transformOrigin: '0 0' }}
        >
          {horizontal ? (
            navigation.isChapterEndShown && activeChapter ? (
              <Center mih="100dvh">
                <ReaderChapterEnd
                  titleId={titleId}
                  nextChapterId={activeChapter.nextChapterId}
                  isNextUnavailable={Boolean(
                    activeChapter.nextChapterId &&
                    isChapterUnavailable(activeChapter.nextChapterId),
                  )}
                />
              </Center>
            ) : (
              <ReaderSpread
                chapter={activeChapter}
                settings={settings}
                position={position}
                pageStep={pageStep}
                window={pageWindow}
              />
            )
          ) : (
            <Stack gap={settings.chapterGap} mih="100dvh">
              {displayedChapters.map((chapter) => (
                <Box key={chapter.chapterId}>
                  <ReaderVerticalChapter
                    chapter={chapter}
                    settings={settings}
                    window={pageWindow}
                    loaded={loaded}
                  />
                </Box>
              ))}
              <ReaderFeedFooter
                titleId={titleId}
                chapter={displayedChapters.at(-1)}
                autoNextChapter={settings.autoNextChapter}
                isChapterUnavailable={isChapterUnavailable}
              />
            </Stack>
          )}
        </Box>
      </PageLayout.Content>
    </AppShell.Main>
  );
}

export default ReaderPages;
