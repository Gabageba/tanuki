import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';

export const SCHEMES = Object.values(COLOR_SCHEME);

/** Ширина рамки «мобилка»: узкий телефон, на котором вариант должен помещаться без прокрутки. */
export const MOBILE_FRAME_WIDTH = 360;

export type VariantProps = {
  value: ColorScheme;
  onChange: (value: ColorScheme) => void;
  /** Вариант стоит в мобильной рамке: брейкпоинты смотрят на окно, а не на рамку. */
  narrow: boolean;
};
