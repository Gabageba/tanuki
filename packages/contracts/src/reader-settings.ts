import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

export const READER_READING_MODE = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
} as const;
export type ReaderReadingMode = EnumLiteralsOf<typeof READER_READING_MODE>;
export const ReaderReadingModeSchema = z.enum(READER_READING_MODE);

export const READER_PAGE_FIT = {
  FIT_WIDTH: 'fitWidth',
  FIT_HEIGHT: 'fitHeight',
} as const;
export type ReaderPageFit = EnumLiteralsOf<typeof READER_PAGE_FIT>;
export const ReaderPageFitSchema = z.enum(READER_PAGE_FIT);

export const READER_DIRECTION = { LTR: 'ltr', RTL: 'rtl' } as const;
export type ReaderDirection = EnumLiteralsOf<typeof READER_DIRECTION>;
export const ReaderDirectionSchema = z.enum(READER_DIRECTION);

export const READER_PAGE_LAYOUT = { SINGLE: 'single', SPREAD: 'spread' } as const;
export type ReaderPageLayout = EnumLiteralsOf<typeof READER_PAGE_LAYOUT>;
export const ReaderPageLayoutSchema = z.enum(READER_PAGE_LAYOUT);

export const READER_BRIGHTNESS = { MIN: 20, MAX: 100, DEFAULT: 100, MEDIUM: 60 } as const;
export const READER_PREFETCH = { MIN: 0, MAX: 10, DEFAULT: 3 } as const;

/** Bounds and quick-pick presets for the container width slider — shared so the API's validation
 *  and the drawer's slider/presets can't drift apart. */
export const READER_CONTAINER_WIDTH = {
  MIN: 480,
  MAX: 1200,
  NARROW: 600,
  MEDIUM: 760,
  WIDE: 960,
} as const;

/**
 * То же для ширины боковых зон клика в горизонтальном режиме, в процентах экрана на каждую
 * сторону. MAX намеренно меньше 50: на 50% две зоны смыкаются и середина, которой прячется и
 * возвращается шапка, становится недостижимой — а другого способа вернуть её в горизонтальном
 * режиме нет, там нет скролла.
 */
export const READER_TAP_ZONE_WIDTH = {
  MIN: 10,
  MAX: 40,
  NARROW: 15,
  MEDIUM: 33,
  WIDE: 40,
} as const;

/** Отступ между страницами в вертикальном режиме, в пикселях. В постраничном режиме страница или
 *  разворот заполняет экран, так что отступ вертикальной ленты не показывается — настройки для него
 *  там нет. */
export const READER_PAGE_GAP = {
  MIN: 0,
  MAX: 48,
  NARROW: 0,
  MEDIUM: 16,
  WIDE: 32,
} as const;

/** Отступ между главами в вертикальной ленте, в пикселях. Заметно больше отступа между
 *  страницами: он и есть единственный признак того, что одна глава кончилась и началась
 *  следующая — ни подписи, ни разделителя на стыке нет. */
export const READER_CHAPTER_GAP = {
  MIN: 0,
  MAX: 200,
  NARROW: 32,
  MEDIUM: 64,
  WIDE: 120,
} as const;

export const ReaderSettingsSchema = z.object({
  readingMode: ReaderReadingModeSchema,
  pageFit: ReaderPageFitSchema,
  containerWidth: z.number().int().min(READER_CONTAINER_WIDTH.MIN).max(READER_CONTAINER_WIDTH.MAX),
  tapZoneWidth: z.number().int().min(READER_TAP_ZONE_WIDTH.MIN).max(READER_TAP_ZONE_WIDTH.MAX),
  pageGap: z.number().int().min(READER_PAGE_GAP.MIN).max(READER_PAGE_GAP.MAX),
  chapterGap: z.number().int().min(READER_CHAPTER_GAP.MIN).max(READER_CHAPTER_GAP.MAX),
  /** Дочитанная глава сразу продолжается следующей. Выключено — в конце главы читатель видит
   *  экран с переходом и идёт дальше сам. */
  autoNextChapter: z.boolean(),
  /** Шапка и панель глав уезжают при прокрутке вниз. Выключено — их прячет и возвращает только
   *  тап по странице. */
  hidePanelsOnScroll: z.boolean(),
  // Defaults preserve version 1 backups made before these settings existed.
  direction: ReaderDirectionSchema.default(READER_DIRECTION.LTR),
  pageLayout: ReaderPageLayoutSchema.default(READER_PAGE_LAYOUT.SINGLE),
  brightness: z
    .number()
    .int()
    .min(READER_BRIGHTNESS.MIN)
    .max(READER_BRIGHTNESS.MAX)
    .default(READER_BRIGHTNESS.DEFAULT),
  prefetchPages: z
    .number()
    .int()
    .min(READER_PREFETCH.MIN)
    .max(READER_PREFETCH.MAX)
    .default(READER_PREFETCH.DEFAULT),
  keepScreenOn: z.boolean().default(false),
});
export type ReaderSettings = z.infer<typeof ReaderSettingsSchema>;

/** What a user gets before ever saving anything — returned by the API as-is and used by the
 *  frontend as placeholder data, so the drawer is never shown unfilled. */
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  readingMode: READER_READING_MODE.VERTICAL,
  pageFit: READER_PAGE_FIT.FIT_WIDTH,
  containerWidth: READER_CONTAINER_WIDTH.MEDIUM,
  tapZoneWidth: READER_TAP_ZONE_WIDTH.MEDIUM,
  pageGap: READER_PAGE_GAP.NARROW,
  chapterGap: READER_CHAPTER_GAP.MEDIUM,
  autoNextChapter: true,
  hidePanelsOnScroll: true,
  direction: READER_DIRECTION.LTR,
  pageLayout: READER_PAGE_LAYOUT.SINGLE,
  brightness: READER_BRIGHTNESS.DEFAULT,
  prefetchPages: READER_PREFETCH.DEFAULT,
  keepScreenOn: false,
};

export const UpdateReaderSettingsRequestSchema = ReaderSettingsSchema;
export type UpdateReaderSettingsRequest = z.infer<typeof UpdateReaderSettingsRequestSchema>;
