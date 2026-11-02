import { useEffect, useRef, useState } from 'react';
import { useNetwork } from '@mantine/hooks';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import { getFollowingPages } from '../navigation';

const PREFETCH_CONCURRENCY = 2;

type Params = {
  chapters: ReaderFeedChapter[];
  position: ReaderPosition;
  count: number;
  autoNextChapter: boolean;
  visible: Set<string>;
};

function useReaderPrefetch({ chapters, position, count, autoNextChapter, visible }: Params) {
  const { online } = useNetwork();
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const known = useRef(new Set<string>());
  const feed = autoNextChapter
    ? chapters
    : chapters.filter((chapter) => chapter.chapterId === position.chapterId);
  const key = JSON.stringify(
    getFollowingPages(feed, position, count)
      .filter(({ chapterId, page }) => !visible.has(`${chapterId}#${page.index}`))
      .map(({ page }) => page.url),
  );

  useEffect(() => {
    if (!online) return;
    let disposed = false;
    let active = 0;
    const queue = (JSON.parse(key) as string[]).filter((url) => !known.current.has(url));
    const images = new Set<HTMLImageElement>();
    const next = () => {
      while (!disposed && active < PREFETCH_CONCURRENCY && queue.length) {
        const url = queue.shift();
        if (!url) continue;
        const img = new window.Image();
        active++;
        images.add(img);
        const finish = () => {
          images.delete(img);
          img.onload = null;
          img.onerror = null;
          active--;
          next();
        };
        img.onload = async () => {
          try {
            await img.decode();
          } catch {
            /* A later visible page handles its own error. */
          }
          if (!disposed) {
            known.current.add(url);
            setLoaded((previous) => new Set(previous).add(url));
          }
          finish();
        };
        img.onerror = finish;
        img.src = url;
      }
    };
    next();
    return () => {
      disposed = true;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
      }
    };
  }, [key, online]);

  return loaded;
}

export default useReaderPrefetch;
