import { useLayoutEffect, useRef, useState } from 'react';
import type { Tag } from '@tanuki/contracts';

const TAG_GAP = 6;

function useTagLines(tags: Tag[], maxLines: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measurer = measureRef.current;
    if (!container || !measurer) return;
    let active = true;

    const measure = () => {
      if (!active) return;
      const widths = Array.from(measurer.children).map(
        (child) => child.getBoundingClientRect().width,
      );
      const overflowWidth = widths.pop() ?? 0;
      const availableWidth = container.getBoundingClientRect().width;
      for (let count = tags.length; count >= 0; count -= 1) {
        const candidates = widths.slice(0, count);
        if (count < tags.length) candidates.push(overflowWidth);
        let lines = 1;
        let usedWidth = 0;
        for (const width of candidates) {
          const nextWidth = usedWidth + (usedWidth > 0 ? TAG_GAP : 0) + width;
          if (usedWidth > 0 && nextWidth > availableWidth) {
            lines += 1;
            usedWidth = width;
          } else {
            usedWidth = nextWidth;
          }
        }
        if (lines <= maxLines) {
          setVisibleCount(count);
          return;
        }
      }
    };

    measure();
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(measurer);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [tags, maxLines]);

  return { containerRef, measureRef, visibleCount };
}

export default useTagLines;
