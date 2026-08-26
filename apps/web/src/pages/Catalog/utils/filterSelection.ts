import type { EnumLiteralsOf, FilterGroup, FilterSelection } from '@tanuki/contracts';

/** Wire format for one repeated `?filters=` value — mirrors apps/api's parseFilterQuery. */
export const serializeFilters = (filters: FilterSelection[]): string[] => {
  return filters.map((f) => `${f.groupId}:${f.exclude ? '!' : ''}${f.key}`);
};

/** Inverse of serializeFilters — parses `?filters=` values from the URL back into a selection. */
export const parseFilters = (raw: string[]): FilterSelection[] => {
  return raw.flatMap((value) => {
    const separatorIndex = value.indexOf(':');
    if (separatorIndex < 0) return [];
    const groupId = value.slice(0, separatorIndex);
    const rest = value.slice(separatorIndex + 1);
    const exclude = rest.startsWith('!');
    const key = exclude ? rest.slice(1) : rest;
    if (!groupId || !key) return [];
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
  const found = selection.find((s) => s.groupId === groupId && s.key === key);
  if (!found) {
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
  const next = selection.filter((s) => !(s.groupId === groupId && s.key === key));
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
  const selected = selection.filter((s) => s.groupId === groupId);

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
  const [first, ...rest] = selection.filter((s) => s.groupId === group.id);
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
