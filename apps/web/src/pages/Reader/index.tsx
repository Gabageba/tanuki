import { AppShell } from '@mantine/core';
import { useParams } from 'react-router';
import { DEFAULT_READER_SETTINGS } from '@tanuki/contracts';
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

function Reader() {
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const { data: readerSettings } = useReaderSettings();
  const settings = readerSettings ?? DEFAULT_READER_SETTINGS;
  const {
    chapters,
    activeChapter,
    position,
    setPosition,
    prependChapter,
    registerPage,
    isChapterUnavailable,
    isPinned,
    isPending,
    query: feedQuery,
  } = useReaderFeed({
    titleId,
    chapterId,
    readingMode: settings.readingMode,
    autoNextChapter: settings.autoNextChapter,
  });
  const { visible, toggle } = useReaderHeaderVisibility({
    ignoreScroll: isPinned,
    hideOnScroll: settings.hidePanelsOnScroll,
  });
  useSaveReadingProgress({ titleId, position });

  // Шапка и контролы говорят о главе, которую читают прямо сейчас, а не о той, с которой чтение
  // начиналось: в ленте это разные главы, и адрес идёт следом за первой. Пока подклеенная глава
  // грузится, страниц у неё ещё нет — счётчик прячем, а не показываем «1 / 0».
  const pagesLength = activeChapter?.pages.length || null;
  useRecordChapterRead({ titleId, position, pagesLength });
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
        pagesLength={pagesLength}
        feedQuery={feedQuery}
      />
      <ReaderPages
        titleId={titleId}
        chapters={chapters}
        position={position}
        setPosition={setPosition}
        prependChapter={prependChapter}
        isPending={isPending}
        settings={settings}
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
        pagesLength={pagesLength}
        visible={visible}
        feedQuery={feedQuery}
      />
    </AppShell>
  );
}

export default Reader;
