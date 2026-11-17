import { useLayoutEffect, useRef, useState } from 'react';
import type { ViewMode } from '@/shared/lib/viewMode';
import { INITIAL_LAYOUT } from '../models';

/** Число колонок и отступы берём из настоящей сетки: брейкпоинты остаются в ViewModeGrid. */
function useGridLayout(viewMode: ViewMode) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(INITIAL_LAYOUT);

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const measure = () => {
      const style = getComputedStyle(grid);
      const rect = grid.getBoundingClientRect();
      const next = {
        columns: Math.max(1, style.gridTemplateColumns.split(' ').length),
        gap: parseFloat(style.rowGap) || 0,
        width: rect.width,
        scrollMargin: rect.top + window.scrollY,
      };
      setLayout((previous) =>
        previous.columns === next.columns &&
        previous.gap === next.gap &&
        previous.width === next.width &&
        previous.scrollMargin === next.scrollMargin
          ? previous
          : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [viewMode]);

  return { ref, layout };
}

export default useGridLayout;
