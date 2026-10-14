import type { ReactNode } from 'react';
import { SimpleGrid, type SimpleGridProps } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';

type Props = {
  viewMode: ViewMode;
  children: ReactNode;
};

/** `ViewModeGrid` каталога, но колонки считаются от ширины рамки, а не окна: в рамке телефона
 *  сетка должна быть телефонной. В реализации — сам `ViewModeGrid`. */
function BlockGrid({ viewMode, children }: Props) {
  const cols: SimpleGridProps['cols'] =
    viewMode === VIEW_MODE.LIST
      ? { base: 1, '760px': 2 }
      : { base: 2, '440px': 3, '580px': 4, '740px': 5, '900px': 6 };

  return (
    <SimpleGrid type="container" cols={cols} spacing="md">
      {children}
    </SimpleGrid>
  );
}

export default BlockGrid;
