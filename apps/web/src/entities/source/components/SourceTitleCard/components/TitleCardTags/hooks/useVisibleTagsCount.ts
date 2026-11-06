import { useLayoutEffect, useRef, useState } from 'react';
import type { Tag } from '@tanuki/contracts';

const TAG_GAP = 6;

type MeasuredState = {
  tagWidths: number[];
  overflowWidth: number;
  containerWidth: number;
};

function useVisibleTagsCount(tags: Tag[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MeasuredState | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measurer = measureRef.current;
    if (!container || !measurer) return;
    let isActive = true;

    const measure = () => {
      if (!isActive) return;
      const children = Array.from(measurer.children);
      const overflowWidth = children.pop()?.getBoundingClientRect().width ?? 0;
      const tagWidths = children.map((child) => child.getBoundingClientRect().width);
      const containerWidth = container.getBoundingClientRect().width;
      setState({ tagWidths, overflowWidth, containerWidth });
    };
    measure();
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(measurer);

    return () => {
      isActive = false;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [tags]);

  if (!state) {
    return { containerRef, measureRef, visibleCount: null };
  }

  const { tagWidths, overflowWidth, containerWidth } = state;
  let usedWidth = 0;
  let visibleCount = 0;

  for (let i = 0; i < tagWidths.length; i += 1) {
    const width = (tagWidths[i] ?? 0) + (visibleCount > 0 ? TAG_GAP : 0);
    const hasMore = i < tagWidths.length - 1;
    const reserve = hasMore ? overflowWidth + TAG_GAP : 0;

    if (usedWidth + width + reserve > containerWidth) break;

    usedWidth += width;
    visibleCount += 1;
  }

  return { containerRef, measureRef, visibleCount };
}

export default useVisibleTagsCount;
