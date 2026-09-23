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

/** Отступ между страницами в вертикальном режиме, в пикселях. В горизонтальном режиме видна ровно
 *  одна страница за раз, так что отступ между ними никогда не показывается — настройки для него
 *  там нет. */
export const READER_PAGE_GAP = {
  MIN: 0,
  MAX: 48,
  NARROW: 0,
  MEDIUM: 16,
  WIDE: 32,
} as const;

export const ReaderSettingsSchema = z.object({
  readingMode: ReaderReadingModeSchema,
  pageFit: ReaderPageFitSchema,
  containerWidth: z.number().int().min(READER_CONTAINER_WIDTH.MIN).max(READER_CONTAINER_WIDTH.MAX),
  tapZoneWidth: z.number().int().min(READER_TAP_ZONE_WIDTH.MIN).max(READER_TAP_ZONE_WIDTH.MAX),
  pageGap: z.number().int().min(READER_PAGE_GAP.MIN).max(READER_PAGE_GAP.MAX),
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
};

export const UpdateReaderSettingsRequestSchema = ReaderSettingsSchema;
export type UpdateReaderSettingsRequest = z.infer<typeof UpdateReaderSettingsRequestSchema>;
