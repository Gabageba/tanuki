import { Stack } from '@mantine/core';
import type { ReaderSettings } from '@tanuki/contracts';
import type { ReaderFeedChapter } from '../models';
import type useReaderPageWindow from '../hooks/useReaderPageWindow';
import ReaderPageSlot from './ReaderPageSlot';
import ReaderPagesSkeleton from './ReaderPagesSkeleton';

type Props = {
  chapter: ReaderFeedChapter;
  settings: ReaderSettings;
  window: ReturnType<typeof useReaderPageWindow>;
  loaded: Set<string>;
  activeKey: string;
  transform: string;
  loading?: boolean;
};

function ReaderVerticalPages({
  chapter,
  settings,
  window,
  loaded,
  activeKey,
  transform,
  loading = false,
}: Props) {
  if (chapter.pages.length === 0)
    return <ReaderPagesSkeleton containerWidth={settings.containerWidth} />;
  return (
    <Stack align="center" gap={settings.pageGap}>
      {chapter.pages.map((page) => {
        const key = `${chapter.chapterId}#${page.index}`;
        return (
          <ReaderPageSlot
            key={page.index}
            ref={window.registerPage}
            chapterId={chapter.chapterId}
            page={page}
            settings={settings}
            pagesLength={chapter.pages.length}
            ratio={window.ratios.get(key)}
            showImage={
              !loading &&
              window.mounted.has(key) &&
              (window.visible.has(key) || loaded.has(page.url))
            }
            onMeasure={window.measure}
            transform={key === activeKey ? transform : undefined}
          />
        );
      })}
    </Stack>
  );
}

export default ReaderVerticalPages;
