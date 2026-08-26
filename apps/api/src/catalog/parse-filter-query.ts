import type { FilterSelection } from '@tanuki/parsers';

/**
 * Wire format for one repeated `?filters=` value: `groupId:key` to include, `groupId:!key` to
 * exclude — mirrors how parsers encode exclude natively (see desu's applyFilterParams), so this
 * round-trips without an extra JSON layer in the URL.
 */
export const parseFilterQuery = (raw: string[] | string | undefined): FilterSelection[] => {
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return values.flatMap((value) => {
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
