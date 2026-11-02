import { Center } from '@mantine/core';
import type { ReaderFeedChapter } from '../models';
import ReaderChapterEnd from './ReaderChapterEnd';

type Props = {
  titleId: string;
  chapter: ReaderFeedChapter | undefined;
  autoNextChapter: boolean;
  isChapterUnavailable: (chapterId: string) => boolean;
};

function ReaderFeedFooter({ titleId, chapter, autoNextChapter, isChapterUnavailable }: Props) {
  if (!chapter || chapter.isPending) return null;
  const unavailable = Boolean(chapter.nextChapterId && isChapterUnavailable(chapter.nextChapterId));
  if (chapter.nextChapterId && autoNextChapter && !unavailable && !chapter.isError) return null;
  return (
    <Center py="xl" bg="var(--mantine-color-body)">
      <ReaderChapterEnd
        titleId={titleId}
        nextChapterId={chapter.isError ? chapter.chapterId : chapter.nextChapterId}
        isNextUnavailable={chapter.isError ? isChapterUnavailable(chapter.chapterId) : unavailable}
      />
    </Center>
  );
}

export default ReaderFeedFooter;
