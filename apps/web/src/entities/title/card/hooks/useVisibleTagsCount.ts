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

    const children = Array.from(measurer.children) as HTMLElement[];
    const overflowWidth = children.pop()?.offsetWidth ?? 0;
    const tagWidths = children.map((child) => child.offsetWidth);

    setState({ tagWidths, overflowWidth, containerWidth: container.offsetWidth });

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? container.offsetWidth;
      setState((prev) => (prev ? { ...prev, containerWidth: width } : prev));
    });
    observer.observe(container);

    return () => observer.disconnect();
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
