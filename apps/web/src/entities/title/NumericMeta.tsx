import { Box } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * Числовая часть мета-строки карточки — год, счётчик глав. Размер и цвет наследуются от
 * обёртки `MidDotGroup`, меняется только гарнитура: цифры сканируются по колонке карточек,
 * поэтому идут моноширинным, тогда как соседний тип тайтла остаётся обычным текстом.
 */
function NumericMeta({ children }: Props) {
  return (
    <Box component="span" ff="monospace">
      {children}
    </Box>
  );
}

export default NumericMeta;
