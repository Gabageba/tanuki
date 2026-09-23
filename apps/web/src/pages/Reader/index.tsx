import { AppShell } from '@mantine/core';
import { useParams } from 'react-router';
import ReaderHeader from './components/ReaderHeader';
import ReaderMobileControls from './components/ReaderMobileControls';
import ReaderPages from './components/ReaderPages';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import useChapterPages from './hooks/useChapterPages';
import useReaderHeaderVisibility from './hooks/useReaderHeaderVisibility';

function Reader() {
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const { data: chapterData, isPending: isChapterDataPending } = useChapterPages({
    titleId,
    chapterId,
  });
  const { visible, toggle } = useReaderHeaderVisibility();

  const prevChapterId = chapterData?.prevChapterId || null;
  const nextChapterId = chapterData?.nextChapterId || null;

  return (
    <AppShell header={{ height: HEADER_HEIGHT, collapsed: !visible }}>
      <ReaderHeader
        titleId={titleId}
        chapterId={chapterId}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        isChapterDataPending={isChapterDataPending}
      />
      <ReaderPages
        titleId={titleId}
        chapterData={chapterData}
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
