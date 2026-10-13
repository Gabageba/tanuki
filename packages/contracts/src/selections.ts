import { z } from 'zod';
import { SearchGroupStatusSchema } from './search';
import { HomeSectionInfoSchema } from './source';
import { TitleSchema } from './title';

/** Блок главной сайта с тайтлами. Пустой блок (на странице не нашёлся) фронт не рисует. */
export const HomeSectionSchema = HomeSectionInfoSchema.extend({
  items: z.array(TitleSchema),
});
export type HomeSection = z.infer<typeof HomeSectionSchema>;

/**
 * Подборки одного источника — все его блоки: какие показывать, решают настройки на фронте.
 * Исход опроса — тот же набор, что у группы мультипоиска: не ответивший источник не ошибка
 * запроса, а состояние на месте блоков.
 */
export const SelectionsResponseSchema = z.object({
  sourceId: z.string(),
  status: SearchGroupStatusSchema,
  /** Пустой при любом статусе, кроме `ok`. */
  sections: z.array(HomeSectionSchema),
});
export type SelectionsResponse = z.infer<typeof SelectionsResponseSchema>;
