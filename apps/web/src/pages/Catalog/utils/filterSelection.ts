import type { EnumLiteralsOf, FilterGroup, FilterSelection } from '@tanuki/contracts';

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
  NONE: 'NONE',
  INCLUDE: 'INCLUDE',
  EXCLUDE: 'EXCLUDE',
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

  return {
    included: selected.filter(({ exclude }) => !exclude).length,
    excluded: selected.filter(({ exclude }) => exclude).length,
  };
};

export const clearGroupSelection = (
  selection: FilterSelection[],
  groupId: string,
): FilterSelection[] => selection.filter((s) => s.groupId !== groupId);

/** "Жанр: Вампиры +3" для бейджа применённых фильтров — null, если в группе ничего не выбрано. */
export const getGroupSelectionOptions = (
  group: FilterGroup,
  selection: FilterSelection[],
): {
  title: string;
  firstItem: {
    label: string;
    exclude?: boolean;
  };
  otherItemsLength: number;
} | null => {
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
