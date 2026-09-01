import { SORT_ORDER, type SortOrder } from '@tanuki/contracts';

export type ChanConfig = {
  id: string;
  isNsfw: boolean;
  sortOrders: SortOrder[];
  /**
   * Whether `ListParams.direction` picks the `n=<field><asc|desc>` suffix on MANGACHAN's
   * `/manga/new` route (see `chanDefaultDirection` in engine.ts) — otherwise that route always
   * uses each order's default direction. HENCHAN/YAOICHAN weren't checked against the same
   * `/manga/new?n=` trick, so they stay direction-less until someone verifies it there.
   */
  supportsDirection: boolean;
  /**
   * Browse/search list URLs are shared across all three now — this only still distinguishes
   * `getDetails`'s chapter parsing. HENCHAN's details page has no chapter table; reading happens
   * through a single `/online/<slug>` link instead. YAOICHAN's chapter list lives in `div.manga`
   * elements rather than table rows. Kept as a variant tag (data), not a subclass — see
   * docs/03-parsers.md on why the shared engines here are config-driven factories.
   */
  variant: 'default' | 'henchan' | 'yaoichan';
};

// title/domains live in SOURCE_CATALOG (../catalog) — look them up by id, don't duplicate here.
export const CHAN_CONFIGS: ChanConfig[] = [
  {
    id: 'MANGACHAN',
    isNsfw: false,
    sortOrders: [
      SORT_ORDER.POPULARITY,
      SORT_ORDER.ADDED,
      SORT_ORDER.ALPHABETICAL,
      SORT_ORDER.CHAPTERS,
    ],
    supportsDirection: true,
    variant: 'default',
  },
  {
    id: 'HENCHAN',
    isNsfw: true,
    sortOrders: [SORT_ORDER.NEWEST, SORT_ORDER.POPULARITY, SORT_ORDER.RATING],
    supportsDirection: false,
    variant: 'henchan',
  },
  {
    id: 'YAOICHAN',
    isNsfw: false,
    sortOrders: [SORT_ORDER.NEWEST],
    supportsDirection: false,
    variant: 'yaoichan',
  },
];
