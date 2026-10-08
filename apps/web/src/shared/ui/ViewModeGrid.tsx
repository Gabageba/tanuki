import { SimpleGrid, type SimpleGridProps } from '@mantine/core';
import { useMemo } from 'react';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';

type Props = {
  viewMode: ViewMode;
} & Omit<SimpleGridProps, 'cols' | 'spacing'>;

/** Сетка карточек тайтлов в виде, выбранном пользователем: плитки или список. */
function ViewModeGrid({ children, viewMode }: Props) {
  const cols: SimpleGridProps['cols'] = useMemo(() => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return { base: 2, xxs: 3, xs: 4, sm: 5, md: 6, lg: 7 };
      case VIEW_MODE.LIST:
        return { base: 1, md: 2 };
      default:
        return 1;
    }
  }, [viewMode]);

  return (
    <SimpleGrid cols={cols} spacing="md">
      {children}
    </SimpleGrid>
  );
}

export default ViewModeGrid;
