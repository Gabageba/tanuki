import type { TFunction } from 'i18next';
import {
  FILTER_TYPE,
  type EnumLiteralsOf,
  type FilterGroup,
  type FilterSelection,
} from '@tanuki/contracts';

/** Groups whose options cycle through include → exclude; their checkboxes mark inclusion green. */
export const isExcludableGroup = (group: FilterGroup) =>
  group.type === FILTER_TYPE.CHECKBOX_EXCLUDE ||
  group.type === FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE;

/** `"8".."10"`, `"8.5".."`, `".."2024"` — either bound may be blank, but not both. */
const RANGE_SEPARATOR = '..';

/** Wire format for one repeated `?filters=` value — mirrors apps/api's parseFilterQuery. */
export const serializeFilters = (filters: FilterSelection[]): string[] => {
  return filters.map((f) =>
    'range' in f
      ? `${f.groupId}:${f.range.min ?? ''}${RANGE_SEPARATOR}${f.range.max ?? ''}`
      : `${f.groupId}:${f.exclude ? '!' : ''}${f.key}`,
  );
};

/** Inverse of serializeFilters — parses `?filters=` values from the URL back into a selection. */
export const parseFilters = (raw: string[]): FilterSelection[] => {
  return raw.flatMap((value): FilterSelection[] => {
    const separatorIndex = value.indexOf(':');
    if (separatorIndex < 0) return [];
    const groupId = value.slice(0, separatorIndex);
    const rest = value.slice(separatorIndex + 1);
    if (!groupId) return [];
    if (rest.includes(RANGE_SEPARATOR)) {
      const rangeSeparatorIndex = rest.indexOf(RANGE_SEPARATOR);
      const minRaw = rest.slice(0, rangeSeparatorIndex);
      const maxRaw = rest.slice(rangeSeparatorIndex + RANGE_SEPARATOR.length);
      const min = minRaw ? Number.parseFloat(minRaw) : undefined;
      const max = maxRaw ? Number.parseFloat(maxRaw) : undefined;
      if (min === undefined && max === undefined) return [];
      if ((min !== undefined && Number.isNaN(min)) || (max !== undefined && Number.isNaN(max))) {
        return [];
      }
      return [{ groupId, range: { min, max } }];
    }
    const exclude = rest.startsWith('!');
    const key = exclude ? rest.slice(1) : rest;
    if (!key) return [];
    return [{ groupId, key, exclude: exclude || undefined }];
  });
};

export const OPTION_VALUE = {
  NONE: 'none',
  INCLUDE: 'include',
  EXCLUDE: 'exclude',
} as const;
export type OptionValue = EnumLiteralsOf<typeof OPTION_VALUE>;

export const getOptionValue = (
  selection: FilterSelection[],
  groupId: string,
  key: string,
): OptionValue => {
  const found = selection.find((s) => 'key' in s && s.groupId === groupId && s.key === key);
  if (!found || !('key' in found)) {
    return OPTION_VALUE.NONE;
  }
  return found.exclude ? OPTION_VALUE.EXCLUDE : OPTION_VALUE.INCLUDE;
};

export const setOptionValue = (
  selection: FilterSelection[],
  groupId: string,
  key: string,
  value: OptionValue,
): FilterSelection[] => {
  const next = selection.filter((s) => !('key' in s && s.groupId === groupId && s.key === key));
  if (value === OPTION_VALUE.NONE) {
    return next;
  }
  return [...next, { groupId, key, exclude: value === OPTION_VALUE.EXCLUDE }];
};

export const countGroupSelections = (
  selection: FilterSelection[],
  groupId: string,
): {
  included: number;
  excluded: number;
} => {
  const selected = selection.filter(
    (s): s is Extract<FilterSelection, { key: string }> => 'key' in s && s.groupId === groupId,
  );
  const range = getRangeSelection(selection, groupId);

  return {
    included: selected.filter(({ exclude }) => !exclude).length + (range ? 1 : 0),
    excluded: selected.filter(({ exclude }) => exclude).length,
  };
};

export const getRangeSelection = (
  selection: FilterSelection[],
  groupId: string,
): { min?: number; max?: number } | undefined => {
  const found = selection.find(
    (s): s is Extract<FilterSelection, { range: { min?: number; max?: number } }> =>
      'range' in s && s.groupId === groupId,
  );
  return found?.range;
};

export const setRangeSelection = (
  selection: FilterSelection[],
  groupId: string,
  range: { min?: number; max?: number },
): FilterSelection[] => {
  const next = selection.filter((s) => !('range' in s && s.groupId === groupId));
  if (range.min === undefined && range.max === undefined) {
    return next;
  }
  return [...next, { groupId, range }];
};

export const clearGroupSelection = (
  selection: FilterSelection[],
  groupId: string,
): FilterSelection[] => selection.filter((s) => s.groupId !== groupId);

export const groupHasSelection = (selection: FilterSelection[], groupId: string): boolean =>
  selection.some((s) => s.groupId === groupId);

/** RADIO groups only ever hold at most one `{ groupId, key }` selection — no `exclude` axis. */
export const getRadioValue = (selection: FilterSelection[], groupId: string): string | null => {
  const found = selection.find(
    (s): s is Extract<FilterSelection, { key: string }> => 'key' in s && s.groupId === groupId,
  );
  return found?.key ?? null;
};

export const setRadioValue = (
  selection: FilterSelection[],
  groupId: string,
  key: string | null,
): FilterSelection[] => {
  const next = clearGroupSelection(selection, groupId);
  return key === null ? next : [...next, { groupId, key }];
};

/**
 * Enforces `FilterGroup.exclusiveGroup` — groups sharing a tag are alternative browsing routes on
 * the source, not combinable (e.g. manga-chan.me: tags / "Тип" / "Статус" each replace the whole
 * listing path). Called after the user confirms the swap — see useExclusiveFilterConfirm.
 */
export const applyExclusiveGroups = (
  groups: FilterGroup[],
  changedGroup: FilterGroup,
  next: FilterSelection[],
): FilterSelection[] => {
  if (!changedGroup.exclusiveGroup) return next;
  const siblingIds = groups
    .filter((g) => g.id !== changedGroup.id && g.exclusiveGroup === changedGroup.exclusiveGroup)
    .map((g) => g.id);
  return siblingIds.reduce((acc, groupId) => clearGroupSelection(acc, groupId), next);
};

type GroupSelectionOptions = {
  title: string;
  firstItem: {
    label: string;
    exclude?: boolean;
  };
  otherItemsLength: number;
} | null;

const getRangeGroupSelectionOptions = (
  group: FilterGroup,
  selection: FilterSelection[],
  t: TFunction,
): GroupSelectionOptions => {
  const range = getRangeSelection(selection, group.id);
  if (!range) {
    return null;
  }
  const preset = group.settings?.presets?.find((p) => p.min === range.min && p.max === range.max);
  let label = preset?.label ?? '';

  if (!label) {
    if (range.min !== undefined && range.max !== undefined) {
      label = `${range.min}–${range.max}`;
    } else if (range.min !== undefined) {
      label = t('fromValue', { value: range.min });
    } else if (range.max !== undefined) {
      label = t('toValue', { value: range.max });
    }
  }

  return {
    title: group.title,
    firstItem: { label },
    otherItemsLength: 0,
  };
};

const getCheckboxGroupSelectionOptions = (
  group: FilterGroup,
  selection: FilterSelection[],
): GroupSelectionOptions => {
  const [first, ...rest] = selection.filter(
    (s): s is Extract<FilterSelection, { key: string }> => 'key' in s && s.groupId === group.id,
  );
  if (!first) {
    return null;
  }
  const firstItem = group.options.find((o) => o.key === first.key);
  return {
    title: group.title,
    firstItem: {
      label: firstItem?.title ?? first.key,
      exclude: first.exclude,
    },
    otherItemsLength: rest.length,
  };
};

/** "Жанр: Вампиры +3" для бейджа применённых фильтров — null, если в группе ничего не выбрано. */
export const getGroupSelectionOptions = (
  group: FilterGroup,
  selection: FilterSelection[],
  t: TFunction,
): GroupSelectionOptions => {
  if (group.type === FILTER_TYPE.RANGE) {
    return getRangeGroupSelectionOptions(group, selection, t);
  }
  return getCheckboxGroupSelectionOptions(group, selection);
};
