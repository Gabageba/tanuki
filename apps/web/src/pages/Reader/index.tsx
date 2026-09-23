import { AppShell } from '@mantine/core';
import { useParams } from 'react-router';
import { DEFAULT_READER_SETTINGS } from '@tanuki/contracts';
import ReaderHeader from './components/ReaderHeader';
import ReaderMobileControls from './components/ReaderMobileControls';
import ReaderPages from './components/ReaderPages';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import useChapterPages from './hooks/useChapterPages';
import useReaderHeaderVisibility from './hooks/useReaderHeaderVisibility';
import useReaderSettings from './hooks/useReaderSettings';

function Reader() {
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const { data: chapterData, isPending: isChapterDataPending } = useChapterPages({
    titleId,
    chapterId,
  });
  const { data: readerSettings } = useReaderSettings();
  const { visible, toggle } = useReaderHeaderVisibility();

  const prevChapterId = chapterData?.prevChapterId || null;
  const nextChapterId = chapterData?.nextChapterId || null;
  const settings = readerSettings ?? DEFAULT_READER_SETTINGS;

  // offset: false — шапка не отодвигает контент, а лежит поверх него (она и так fixed). Иначе её
  // показ/скрытие меняло бы доступную высоту, а с ней и размер страницы в режиме «страница
  // целиком»: картинка масштабировалась бы на каждое переключение шапки.
  return (
    <AppShell header={{ height: HEADER_HEIGHT, collapsed: !visible, offset: false }}>
      <ReaderHeader
        titleId={titleId}
        chapterId={chapterId}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        isChapterDataPending={isChapterDataPending}
      />
      <ReaderPages
        titleId={titleId}
        chapterId={chapterId}
        chapterData={chapterData}
        settings={settings}
        onTap={toggle}
        isChaptersDataPending={isChapterDataPending}
      />
      <ReaderMobileControls
        titleId={titleId}
        chapterId={chapterId}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        visible={visible}
      />
    </AppShell>
  );
}

export default Reader;
