import { SimpleGrid, type SimpleGridProps } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';

type Props = {
  viewMode: ViewMode;
} & Omit<SimpleGridProps, 'cols' | 'spacing'>;

/** Сетка карточек тайтлов в виде, выбранном пользователем: плитки, список или без обложек. */
function ViewModeGrid({ children, viewMode }: Props) {
  const getLayout = (): SimpleGridProps => {
    switch (viewMode) {
      case VIEW_MODE.COVERLESS:
        return { cols: { base: 1, md: 2 }, spacing: 'sm' };
      case VIEW_MODE.GRID:
        return { cols: { base: 2, xxs: 3, xs: 4, sm: 5, md: 6, lg: 7 }, spacing: 'md' };
      case VIEW_MODE.LIST:
        return { cols: { base: 1, md: 2 }, spacing: 'md' };
    }
  };

  return <SimpleGrid {...getLayout()}>{children}</SimpleGrid>;
}

export default ViewModeGrid;
