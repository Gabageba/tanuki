import { z } from 'zod';
import { SearchGroupStatusSchema } from './search';
import { SortOrderSchema, HomeSectionInfoSchema } from './source';
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

/**
 * Порция одного блока: `page` с 1, `variant` — id одного из `variants` блока; у блока без
 * вариантов не учитывается, чужой или пропущенный — первый вариант.
 */
export const SelectionsSectionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  variant: z.string().optional(),
  order: SortOrderSchema.optional(),
});
export type SelectionsSectionQuery = z.infer<typeof SelectionsSectionQuerySchema>;

/**
 * Порция блока подборок. Не ответивший источник — статус, как у всех подборок; `hasNextPage` —
 * сайт отдаёт блок порциями и следующая есть. Блок без продолжения приходит одной порцией.
 */
export const SelectionsSectionResponseSchema = z.object({
  sourceId: z.string(),
  sectionId: z.string(),
  status: SearchGroupStatusSchema,
  /** Пустой при любом статусе, кроме `ok`. */
  items: z.array(TitleSchema),
  hasNextPage: z.boolean(),
});
export type SelectionsSectionResponse = z.infer<typeof SelectionsSectionResponseSchema>;
