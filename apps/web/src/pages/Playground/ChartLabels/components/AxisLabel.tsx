import type { CSSProperties, ReactNode } from 'react';
import { Text } from '@mantine/core';
import { LABEL_ALIGN, LABEL_FONT_SIZE, type LabelAlign } from '../models';

type Props = {
  children: ReactNode;
  align?: LabelAlign;
  top?: number;
  isActive?: boolean;
};

const getAlignStyle = (align: LabelAlign): CSSProperties => {
  switch (align) {
    case LABEL_ALIGN.CENTER:
      return { left: '50%', transform: 'translateX(-50%)' };
    case LABEL_ALIGN.START:
      return { left: 0 };
    case LABEL_ALIGN.END:
      return { right: 0 };
  }
};

/** Подпись, которая может быть шире своей ячейки: висит над ней, не раздвигая соседей. */
function AxisLabel({ children, align = LABEL_ALIGN.CENTER, top = 0, isActive }: Props) {
  return (
    <Text
      ff="monospace"
      fz={LABEL_FONT_SIZE}
      lh={1}
      c={isActive ? undefined : 'dimmed'}
      fw={isActive ? 600 : undefined}
      pos="absolute"
      top={top}
      style={{ ...getAlignStyle(align), whiteSpace: 'nowrap' }}
    >
      {children}
    </Text>
  );
}

export default AxisLabel;
