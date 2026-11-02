import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import { getReaderPageKey } from '../lib';

const PAGE_OVERSCAN = 3;

type Params = {
  chapters: ReaderFeedChapter[];
  position: ReaderPosition;
  horizontal: boolean;
  pageStep: number;
  registerPage: (element: HTMLElement | null) => (() => void) | undefined;
};

/** Keep lightweight page boxes in the feed; only the visible window contains images. */
function useReaderPageWindow({ chapters, position, horizontal, pageStep, registerPage }: Params) {
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [ratios, setRatios] = useState<Map<string, number>>(new Map());
  const measurements = useRef(new Map<string, number>());
  const elements = useRef(new Map<string, HTMLElement>());
  const observer = useRef<IntersectionObserver | null>(null);
  const anchor = useRef<{ element: HTMLElement; top: number; scrollY: number } | null>(null);
  const currentKey = getReaderPageKey(position);
  const positionKey = useRef(currentKey);
  useLayoutEffect(() => {
    positionKey.current = currentKey;
  }, [currentKey]);

  useEffect(() => {
    if (horizontal) return;
    const current = new IntersectionObserver((entries) => {
      setVisible((previous) => {
        const next = new Set(previous);
        entries.forEach((entry) => {
          const key = (entry.target as HTMLElement).dataset['readerPageKey'];
          if (!key) return;
          if (
            entry.isIntersecting &&
            entry.intersectionRect.height > 0 &&
            entry.intersectionRect.width > 0
          )
            next.add(key);
          else next.delete(key);
        });
        if (next.size === previous.size && [...next].every((key) => previous.has(key)))
          return previous;
        return next;
      });
    });
    observer.current = current;
    elements.current.forEach((element) => current.observe(element));
    return () => {
      current.disconnect();
      observer.current = null;
    };
  }, [horizontal]);

  const register = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const key = element.dataset['readerPageKey'];
      if (!key) return;
      elements.current.set(key, element);
      const cleanup = registerPage(element);
      observer.current?.observe(element);
      return () => {
        elements.current.delete(key);
        observer.current?.unobserve(element);
        cleanup?.();
      };
    },
    [registerPage],
  );

  const measure = useCallback((key: string, ratio: number) => {
    if (Math.abs((measurements.current.get(key) ?? 0) - ratio) < 0.001) return;
    measurements.current.set(key, ratio);
    const element = elements.current.get(positionKey.current);
    if (element && !anchor.current)
      anchor.current = {
        element,
        top: element.getBoundingClientRect().top,
        scrollY: window.scrollY,
      };
    setRatios((previous) => {
      return new Map(previous).set(key, ratio);
    });
  }, []);

  useLayoutEffect(() => {
    const saved = anchor.current;
    anchor.current = null;
    if (!horizontal && saved?.element.isConnected && saved.scrollY === window.scrollY) {
      const delta = saved.element.getBoundingClientRect().top - saved.top;
      if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' });
    }
  }, [ratios, horizontal]);

  const pages = chapters.flatMap((chapter) =>
    chapter.pages.map((page) => ({ chapterId: chapter.chapterId, pageIndex: page.index })),
  );
  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => getReaderPageKey(page) === currentKey),
  );
  const visibleIndices = horizontal
    ? [activeIndex, activeIndex + pageStep - 1]
    : pages.flatMap((page, index) => (visible.has(getReaderPageKey(page)) ? [index] : []));
  const first = Math.min(activeIndex, ...visibleIndices) - PAGE_OVERSCAN;
  const last = Math.max(activeIndex + pageStep - 1, ...visibleIndices) + PAGE_OVERSCAN;
  const mounted = new Set(pages.slice(Math.max(0, first), last + 1).map(getReaderPageKey));
  const visibleKeys =
    horizontal || visibleIndices.length === 0
      ? new Set(
          pages
            .slice(activeIndex, activeIndex + pageStep)
            .filter((page) => page.chapterId === position.chapterId)
            .map(getReaderPageKey),
        )
      : visible;

  return { registerPage: register, mounted, visible: visibleKeys, ratios, measure };
}

export default useReaderPageWindow;
