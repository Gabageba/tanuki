import type { FilterSelection } from '@tanuki/parsers';

/** `"8".."10"`, `"8.5".."`, `".."2024"` — either bound may be blank, but not both. */
const RANGE_SEPARATOR = '..';

const parseRangeSelection = (groupId: string, rest: string): FilterSelection[] => {
  const separatorIndex = rest.indexOf(RANGE_SEPARATOR);
  if (separatorIndex < 0) return [];
  const minRaw = rest.slice(0, separatorIndex);
  const maxRaw = rest.slice(separatorIndex + RANGE_SEPARATOR.length);
  const min = minRaw ? Number.parseFloat(minRaw) : undefined;
  const max = maxRaw ? Number.parseFloat(maxRaw) : undefined;
  if (min === undefined && max === undefined) return [];
  if ((min !== undefined && Number.isNaN(min)) || (max !== undefined && Number.isNaN(max))) {
    return [];
  }
  return [{ groupId, range: { min, max } }];
};

/**
 * Wire format for one repeated `?filters=` value:
 * - `groupId:key` to include, `groupId:!key` to exclude — mirrors how parsers encode exclude
 *   natively (see desu's applyFilterParams), so this round-trips without an extra JSON layer.
 * - `groupId:min..max` for a RANGE group's bounds (see Inkstory's average_rating/year/
 *   chapters_count) — either side may be blank for an open-ended range (`8.5..`, `..2024`).
 */
export const parseFilterQuery = (raw: string[] | string | undefined): FilterSelection[] => {
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return values.flatMap((value) => {
    const separatorIndex = value.indexOf(':');
    if (separatorIndex < 0) return [];
    const groupId = value.slice(0, separatorIndex);
    const rest = value.slice(separatorIndex + 1);
    if (!groupId) return [];
    if (rest.includes(RANGE_SEPARATOR)) return parseRangeSelection(groupId, rest);
    const exclude = rest.startsWith('!');
    const key = exclude ? rest.slice(1) : rest;
    if (!key) return [];
    return [{ groupId, key, exclude: exclude || undefined }];
  });
};
