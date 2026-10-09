import {
  SEARCH_FILTER_GROUP,
  type FilterSelection,
  type ResolvedSearchFilters,
  type SearchFilterCriteria,
  type SearchFilterGroup,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';

/** How one search criterion (`types` / `states`) maps onto a source's own filter group. */
export type SearchFilterGroupSpec<T extends string> = {
  groupId: string;
  /** Radio groups take one option; a criterion that maps to several can't be expressed there. */
  isMultiple: boolean;
  /** Native option keys for one value; empty when the source has no such option. */
  getKeys: (value: T) => string[];
};

export type SearchFilterSpec = {
  types?: SearchFilterGroupSpec<TitleType>;
  states?: SearchFilterGroupSpec<TitleState>;
};

const resolveGroup = <T extends string>(
  values: T[] | undefined,
  spec: SearchFilterGroupSpec<T> | undefined,
): FilterSelection[] | null => {
  if (!spec) return null;
  const perValue = (values ?? []).map(spec.getKeys);
  // One value without a native option would silently narrow the results to the others, hiding
  // titles the user asked for — better to leave the criterion unapplied.
  if (perValue.some((keys) => keys.length === 0)) return null;
  const keys = [...new Set(perValue.flat())];
  if (!spec.isMultiple && keys.length > 1) return null;
  return keys.map((key) => ({ groupId: spec.groupId, key }));
};

/**
 * Turns the search criteria into the source's own filter selection. A requested criterion the
 * source can't express lands in `unapplied` and doesn't narrow the source's results; an empty one
 * is "no restriction" and appears nowhere.
 */
export const buildSearchFilters = (
  criteria: SearchFilterCriteria,
  spec: SearchFilterSpec,
): ResolvedSearchFilters => {
  const filters: FilterSelection[] = [];
  const unapplied: SearchFilterGroup[] = [];
  const entries = [
    {
      group: SEARCH_FILTER_GROUP.TYPES,
      selection: criteria.types?.length ? resolveGroup(criteria.types, spec.types) : [],
    },
    {
      group: SEARCH_FILTER_GROUP.STATES,
      selection: criteria.states?.length ? resolveGroup(criteria.states, spec.states) : [],
    },
  ];
  for (const { group, selection } of entries) {
    if (selection === null) unapplied.push(group);
    else filters.push(...selection);
  }
  return { filters, unapplied };
};

/** For a source whose search can't take filters: everything requested stays unapplied. */
export const unappliedSearchFilters = (criteria: SearchFilterCriteria): ResolvedSearchFilters => ({
  filters: [],
  unapplied: [
    ...(criteria.types?.length ? [SEARCH_FILTER_GROUP.TYPES] : []),
    ...(criteria.states?.length ? [SEARCH_FILTER_GROUP.STATES] : []),
  ],
});
