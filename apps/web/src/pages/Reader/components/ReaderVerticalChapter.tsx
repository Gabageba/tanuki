import type { ReaderSettings } from '@tanuki/contracts';
import QueryBlock from '@/shared/ui/QueryBlock';
import type { ReaderFeedChapter } from '../models';
import type useReaderPageWindow from '../hooks/useReaderPageWindow';
import ReaderVerticalPages from './ReaderVerticalPages';
import ReaderChapterEmpty from './ReaderChapterEmpty';

type Props = {
  chapter: ReaderFeedChapter;
  settings: ReaderSettings;
  window: ReturnType<typeof useReaderPageWindow>;
  loaded: Set<string>;
  activeKey: string;
  transform: string;
};

function ReaderVerticalChapter(props: Props) {
  return (
    <QueryBlock
      query={props.chapter.query}
      skeleton={<ReaderVerticalPages {...props} loading />}
      empty={<ReaderChapterEmpty />}
      isEmpty={(data) => data.items.length === 0}
    >
      {() => <ReaderVerticalPages {...props} />}
    </QueryBlock>
  );
}

export default ReaderVerticalChapter;
