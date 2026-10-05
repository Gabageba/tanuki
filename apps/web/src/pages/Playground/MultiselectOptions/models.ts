import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Как выглядит выбранный пункт списка — ось O. */
export const OPTION_LOOK = {
  /** Заливка и рамка у каждого выбранного, пункты вплотную — как в global.scss сейчас. */
  CURRENT: 'current',
  /** Тот же вид, но между пунктами зазор 4px — как плитки выбора источника в шапке. */
  GAP: 'gap',
  /** Выбранные подряд сливаются в одну плашку с тонкими разделителями. */
  MERGED: 'merged',
  /** Заливка и цвет текста, без рамки. */
  FLAT: 'flat',
  /** Только цвет текста и галочка. */
  CHECK: 'check',
} as const;
export type OptionLook = EnumLiteralsOf<typeof OPTION_LOOK>;

/** Как виден пункт под курсором при навигации стрелками — ось K. */
export const OPTION_FOCUS = {
  /** Фокус оформлен так же, как выбор, — как сейчас. */
  CURRENT: 'current',
  /** Фокус — подсветка наведения, у выбранного заливка плотнее. */
  HOVER: 'hover',
  /** Фокус — кольцо цвета акцента внутри пункта. */
  RING: 'ring',
} as const;
export type OptionFocus = EnumLiteralsOf<typeof OPTION_FOCUS>;

export type MockOption = {
  value: string;
  label: string;
  checked?: boolean;
  /** Пункт под мышью — в статичном списке наведение не воспроизвести, поэтому оно задано. */
  hovered?: boolean;
  /** Пункт под курсором клавиатуры. */
  focused?: boolean;
};

export type MockList = {
  title: string;
  options: MockOption[];
};

export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  look: OptionLook;
  focus: OptionFocus;
};
