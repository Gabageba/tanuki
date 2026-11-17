import { Box } from '@mantine/core';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useLayoutEffect, type ReactElement } from 'react';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import useGridLayout from './hooks/useGridLayout';
import { OVERSCAN_ROWS } from './models';

type Props = {
  children: ReactElement[];
  viewMode: ViewMode;
};

/** Обычная сетка с прокруткой страницы; в DOM остаются только ряды у видимой области. */
function VirtualizedViewModeGrid({ children, viewMode }: Props) {
  const { ref, layout } = useGridLayout(viewMode);
  const { columns, gap, width, scrollMargin } = layout;
  const getRowKey = useCallback(
    (index: number) => `${viewMode}:${columns}:${children[index * columns]?.key ?? index}`,
    [children, columns, viewMode],
  );
  const estimateSize = () => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return width ? ((width - (columns - 1) * gap) / columns) * (4 / 3) + 68 : 320;
      case VIEW_MODE.LIST:
        return 144;
      case VIEW_MODE.COVERLESS:
        return 96;
    }
  };
  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: Math.ceil(children.length / columns),
    estimateSize,
    getItemKey: getRowKey,
    scrollMargin,
    gap,
    overscan: OVERSCAN_ROWS,
    useAnimationFrameWithResizeObserver: true,
  });

  // После поворота телефона старые высоты рядов уже не подходят даже при том же числе колонок.
  useLayoutEffect(() => {
    virtualizer.measure();
    // Сами DOM-узлы могут сохранить высоту после resize: ResizeObserver тогда не пришлёт
    // новое измерение. Заполняем сброшенный кеш видимыми рядами до отрисовки кадра.
    for (const element of virtualizer.elementsCache.values()) {
      virtualizer.measureElement(element);
    }
  }, [width, columns, viewMode, virtualizer]);

  return (
    <Box pos="relative" h={virtualizer.getTotalSize()} data-virtualized-grid>
      <ViewModeGrid
        ref={ref}
        viewMode={viewMode}
        pos="absolute"
        top={0}
        w="100%"
        h={0}
        aria-hidden
        style={{ visibility: 'hidden', pointerEvents: 'none' }}
      />
      {virtualizer.getVirtualItems().map((row) => (
        <ViewModeGrid
          key={row.key}
          ref={virtualizer.measureElement}
          viewMode={viewMode}
          data-index={row.index}
          pos="absolute"
          top={0}
          left={0}
          w="100%"
          style={{ transform: `translateY(${row.start - scrollMargin}px)` }}
        >
          {children.slice(row.index * columns, (row.index + 1) * columns)}
        </ViewModeGrid>
      ))}
    </Box>
  );
}

export default VirtualizedViewModeGrid;
