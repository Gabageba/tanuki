import type { DrawerRootProps } from '@mantine/core';
import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Значения — позиции Mantine `Drawer`, менять их нельзя. */
export const DRAWER_POSITION = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
} as const satisfies Record<string, NonNullable<DrawerRootProps['position']>>;
export type ResponsiveDrawerPosition = EnumLiteralsOf<typeof DRAWER_POSITION>;

/** С какой стороны drawer выезжает с `sm`: слева — навигация «куда перейти», справа — свойства
 *  и детали. */
export type DrawerSide = Exclude<ResponsiveDrawerPosition, typeof DRAWER_POSITION.BOTTOM>;

/** Высота drawer снизу: по содержимому или почти на весь экран — для длинных списков. */
export const SHEET_HEIGHT = {
  AUTO: 'auto',
  TALL: 'tall',
} as const;
export type SheetHeight = EnumLiteralsOf<typeof SHEET_HEIGHT>;

/** Насколько надо протянуть drawer вниз за шапку, чтобы он закрылся. */
export const SWIPE_CLOSE_DISTANCE = 80;

/** Верх drawer снизу встаёт не выше шапки приложения: видно, что это панель поверх страницы. Это и
 *  высота `TALL`, и предел для `AUTO` — длинное содержимое прокручивается под ним. */
export const SHEET_MAX_HEIGHT = 'calc(100% - var(--app-shell-header-height))';

/** Высота drawer снизу. `size="auto"` Mantine превращает в несуществующую
 *  `var(--drawer-size-auto)`, и высота откатывается на 100%, — поэтому «по содержимому» задаётся
 *  самой переменной `--drawer-height`. */
export const getSheetHeight = (height: SheetHeight) => {
  switch (height) {
    case SHEET_HEIGHT.AUTO:
      return 'auto';
    case SHEET_HEIGHT.TALL:
      return SHEET_MAX_HEIGHT;
  }
};
