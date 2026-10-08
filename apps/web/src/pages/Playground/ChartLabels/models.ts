import type { EnumLiteralsOf } from '@tanuki/contracts';

export type DemoPoint = {
  date: string;
  count: number;
};

export const DEMO_DATA = {
  MINE: 'mine',
  LIVE: 'live',
} as const;
export type DemoData = EnumLiteralsOf<typeof DEMO_DATA>;

export const LABEL_ALIGN = {
  CENTER: 'center',
  START: 'start',
  END: 'end',
} as const;
export type LabelAlign = EnumLiteralsOf<typeof LABEL_ALIGN>;

export const CHART_HEIGHT = 200;
export const BAR_GAP = 3;
/** Зазор между неделями в варианте с разбивкой — заметно шире, чем между днями. */
export const GROUP_GAP = 10;
export const WEEK_DAYS = 7;
export const LABEL_FONT_SIZE = 12;
export const MOBILE_WIDTH = 343;
export const DESKTOP_WIDTH = 520;
