import { Flex } from '@mantine/core';
import { READER_DIRECTION, READER_PAGE_FIT, type ReaderSettings } from '@tanuki/contracts';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import type useReaderPageWindow from '../hooks/useReaderPageWindow';
import ReaderPageSlot from './ReaderPageSlot';
import ReaderChapterEmpty from './ReaderChapterEmpty';

type Props = {
  chapter: ReaderFeedChapter | undefined;
  settings: ReaderSettings;
  position: ReaderPosition;
  pageStep: number;
  window: ReturnType<typeof useReaderPageWindow>;
  transform: string;
};

function ReaderSpread({ chapter, settings, position, pageStep, window, transform }: Props) {
  if (!chapter?.pages.length) return <ReaderChapterEmpty />;
  const pages = chapter.pages.slice(position.pageIndex, position.pageIndex + pageStep);
  const pageSettings =
    pageStep === 2 ? { ...settings, pageFit: READER_PAGE_FIT.FIT_HEIGHT } : settings;
  return (
    <Flex
      w="100%"
      mih="100dvh"
      align={pageStep === 2 ? 'flex-start' : 'center'}
      justify="center"
      direction={settings.direction === READER_DIRECTION.RTL ? 'row-reverse' : 'row'}
      gap={0}
      style={{ transform, transformOrigin: 'center center' }}
    >
      {pages.map((page) => (
        <ReaderPageSlot
          key={`${chapter.chapterId}#${page.index}`}
          page={page}
          chapterId={chapter.chapterId}
          settings={pageSettings}
          pagesLength={chapter.pages.length}
          spread={pages.length === 2}
          ratio={window.ratios.get(`${chapter.chapterId}#${page.index}`)}
          showImage
          onMeasure={window.measure}
        />
      ))}
    </Flex>
  );
}

export default ReaderSpread;
