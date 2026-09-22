import { AppShell } from '@mantine/core';
import { useParams } from 'react-router';
import ReaderHeader from './components/ReaderHeader';
import ReaderPages from './components/ReaderPages';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import useChapterPages from './hooks/useChapterPages';

function Reader() {
  const { titleId = '', chapterId = '' } = useParams<{ titleId: string; chapterId: string }>();
  const { data: chapterData } = useChapterPages({ titleId, chapterId });

  return (
    <AppShell header={{ height: HEADER_HEIGHT }}>
      <ReaderHeader
        titleId={titleId}
        chapterId={chapterId}
        prevChapterId={chapterData?.prevChapterId || null}
        nextChapterId={chapterData?.nextChapterId || null}
      />
      <ReaderPages titleId={titleId} chapterId={chapterId} />
    </AppShell>
  );
}

export default Reader;
