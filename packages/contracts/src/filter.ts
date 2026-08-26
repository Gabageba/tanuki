import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Семантика выбора опции + способ отрисовки группы, одним полем. Раньше это были два независимых
 * enum'а (тип выбора и displayType), но реально источник никогда не выбирает их по отдельности —
 * RANGE вообще не про чекбоксы, а у пары checkbox/searchable-checkbox есть ровно одна ось
 * (исключение да/нет), так что раздельные поля только позволяли собрать несуществующую комбинацию
 * (например RANGE + exclude).
 *
 * CHECKBOX / SEARCHABLE_CHECKBOX — обычный чекбокс (включён/выключен, без исключения).
 * SEARCHABLE_CHECKBOX — то же самое, но для длинного списка (десятки+ опций): скролл и поиск по
 * названию вместо стены чипов.
 * CHECKBOX_EXCLUDE / SEARCHABLE_CHECKBOX_EXCLUDE — та же пара, но трёхпозиционная (не выбран /
 * включить / исключить), как жанры Desu, где чекбокс по клику циклит 0 → 1 → 2 → 0.
 * RANGE — непрерывный диапазон (год, рейтинг, число глав) вместо перечислимых опций; `options`
 * пустой, границы лежат в `FilterGroup.range`, а выбор клиента — в `FilterSelection.range`, не
 * `key` (см. Inkstory: averageRating/year/chaptersCount).
 */
export const FILTER_TYPE = {
  CHECKBOX: 'CHECKBOX',
  CHECKBOX_EXCLUDE: 'CHECKBOX_EXCLUDE',
  SEARCHABLE_CHECKBOX: 'SEARCHABLE_CHECKBOX',
  SEARCHABLE_CHECKBOX_EXCLUDE: 'SEARCHABLE_CHECKBOX_EXCLUDE',
  RANGE: 'RANGE',
} as const;
export type FilterType = EnumLiteralsOf<typeof FILTER_TYPE>;

export const FilterTypeSchema = z.enum(FILTER_TYPE);

export const FilterOptionSchema = z.object({
  key: z.string(),
  title: z.string(),
  /** Число тайтлов с этой опцией на сайте источника, если он его показывает. */
  count: z.number().nullable(),
});

export type FilterOption = z.infer<typeof FilterOptionSchema>;

/** Selectable bounds for a RANGE group — the source's own min/max, not the user's current pick. */
export const FilterRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  /** Smallest meaningful increment, e.g. 0.1 for a 0..10 rating. Omitted means integer steps. */
  step: z.number().optional(),
});

export type FilterRange = z.infer<typeof FilterRangeSchema>;

export const FilterGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: FilterTypeSchema,
  /** Empty for RANGE groups — their selectable bounds live in `range` instead. */
  options: z.array(FilterOptionSchema),
  range: FilterRangeSchema.optional(),
});

export type FilterGroup = z.infer<typeof FilterGroupSchema>;

/**
 * Выбор клиента для одного фильтра — то, что каталог отправляет обратно источнику.
 *
 * Для *_CHECKBOX* групп — `key`, ровно тот `FilterOption.key`, что источник отдал в getFilters();
 * `exclude` имеет смысл только для опций из группы с `type` вида `*_EXCLUDE`.
 *
 * Для RANGE групп — `range` вместо `key`: хотя бы одна из границ обязана быть задана (открытый
 * снизу/сверху диапазон допустим), обе — включительно, в единицах `FilterGroup.range` этой группы.
 */
export type FilterSelection =
  | { groupId: string; key: string; exclude?: boolean }
  | { groupId: string; range: { min?: number; max?: number } };
