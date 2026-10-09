import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';
import { SortOrderSchema } from './source';

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
 * пустой, границы и пресеты лежат в `FilterGroup.settings`, а выбор клиента — в
 * `FilterSelection.range`, не `key` (см. Inkstory: averageRating/year/chaptersCount).
 * RADIO — ровно одна опция за раз, без исключения (как чекбокс-группы, но невзаимоисключающий
 * выбор внутри группы бессмысленен на источнике) — см. manga-chan: "Тип" и "Статус" переключают
 * весь путь листинга, а не добавляют query-параметр.
 * SEARCHABLE_RADIO — то же самое, но для длинного списка (десятки+ опций), как RADIO относится к
 * CHECKBOX/SEARCHABLE_CHECKBOX: скролл и поиск по названию вместо стены радиокнопок — см. multporn:
 * Tags/Character собираются постранично и легко доходят до сотен опций.
 */
export const FILTER_TYPE = {
  CHECKBOX: 'checkbox',
  CHECKBOX_EXCLUDE: 'checkboxExclude',
  SEARCHABLE_CHECKBOX: 'searchableCheckbox',
  SEARCHABLE_CHECKBOX_EXCLUDE: 'searchableCheckboxExclude',
  RANGE: 'range',
  RADIO: 'radio',
  SEARCHABLE_RADIO: 'searchableRadio',
} as const;
export type FilterType = EnumLiteralsOf<typeof FILTER_TYPE>;

export const FilterTypeSchema = z.enum(FILTER_TYPE);

export const FilterOptionSchema = z.object({
  key: z.string(),
  title: z.string(),
  /** Число тайтлов с этой опцией на сайте источника, если он его показывает. */
  count: z.number().nullable(),
  /**
   * *_EXCLUDE groups only: forces this one option back to a plain toggle when the source itself
   * has no exclude semantics for it. MANGALIB's "Другое" mixes a plain "Нет перевода уже 2
   * месяца" checkbox with two include/exclude ones ("Команды в игноре", "Издательский контент")
   * in the same visual list — same source behavior the site itself shows, not a UI quirk.
   */
  excludable: z.boolean().optional(),
});

export type FilterOption = z.infer<typeof FilterOptionSchema>;

/** One quick-pick shortcut for a RANGE group, e.g. "< 20" (max: 20) or "2010-е" (min/max both set). */
export const FilterRangePresetSchema = z.object({
  /** Stable within one group — lets the UI key/select a preset instead of using `label`. Not sent
   *  back to the source; picking a preset just fills in its min/max on the range selection. */
  id: z.string(),
  label: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export type FilterRangePreset = z.infer<typeof FilterRangePresetSchema>;

/**
 * How a RANGE group's bounds should read as text — plain counts ("0 - 2000") can shorten to "2к",
 * but a year is a label, not a magnitude, so "1900 - 2026" must never become "1.9к - 2к".
 */
export const RANGE_FORMAT = {
  NUMBER: 'number',
  YEAR: 'year',
} as const;
export type RangeFormat = EnumLiteralsOf<typeof RANGE_FORMAT>;

export const RangeFormatSchema = z.enum(RANGE_FORMAT);

/** Selectable bounds for a RANGE group — the source's own min/max, not the user's current pick. */
export const FilterRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  /** Smallest meaningful increment, e.g. 0.1 for a 0..10 rating. Omitted means integer steps. */
  step: z.number().optional(),
  /** Defaults to NUMBER when omitted. */
  format: RangeFormatSchema.optional(),
});

export type FilterRange = z.infer<typeof FilterRangeSchema>;

/** Everything a RANGE group needs beyond `options` (which stays empty for it): the selectable
 *  bounds plus the source-authored quick picks, e.g. decade buttons for a year range. */
export const FilterGroupSettingsSchema = z.object({
  range: FilterRangeSchema,
  /** Empty means no quick picks. */
  presets: z.array(FilterRangePresetSchema).optional(),
});

export type FilterGroupSettings = z.infer<typeof FilterGroupSettingsSchema>;

export const FilterGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: FilterTypeSchema,
  /** Empty for RANGE groups — their selectable bounds live in `settings` instead. */
  options: z.array(FilterOptionSchema),
  settings: FilterGroupSettingsSchema.optional(),
  /**
   * Groups sharing this tag can't have a selection at the same time — the source itself only
   * exposes them as alternative browsing routes, not combinable query params (manga-chan: picking
   * a tag, a "Тип" or a "Статус" each replace the whole listing path, so combining any two of them
   * 404s on the source). The UI clears sibling groups' selections when one of them gets picked.
   */
  exclusiveGroup: z.string().optional(),
  /**
   * Narrower Source.sortOrders that applies while this group has an active selection — e.g.
   * multporn's tag/character routes drop UPDATED in favor of VIEWS/RATING (fields that only do
   * anything on those routes), and nudemoon's mangaka/seria/group/perevod routes drop PAGES
   * (unsupported there). Omitted means this group doesn't change what's on offer. The UI falls
   * back to the first entry here when the currently selected order isn't in it.
   */
  sortOrders: z.array(SortOrderSchema).optional(),
  /** Same idea for Source.supportsDirection. Omitted means inherit it unchanged. */
  supportsDirection: z.boolean().optional(),
});

export type FilterGroup = z.infer<typeof FilterGroupSchema>;

/**
 * Выбор клиента для одного фильтра — то, что каталог отправляет обратно источнику.
 *
 * Для *_CHECKBOX* групп — `key`, ровно тот `FilterOption.key`, что источник отдал в getFilters();
 * `exclude` имеет смысл только для опций из группы с `type` вида `*_EXCLUDE`.
 *
 * Для RANGE групп — `range` вместо `key`: хотя бы одна из границ обязана быть задана (открытый
 * снизу/сверху диапазон допустим), обе — включительно, в единицах `FilterGroup.settings.range` этой
 * группы.
 */
export type FilterSelection =
  | { groupId: string; key: string; exclude?: boolean }
  | { groupId: string; range: { min?: number; max?: number } };

export const FilterSelectionSchema: z.ZodType<FilterSelection> = z.union([
  z.object({ groupId: z.string(), key: z.string(), exclude: z.boolean().optional() }),
  z.object({
    groupId: z.string(),
    range: z.object({ min: z.number().optional(), max: z.number().optional() }),
  }),
]);
