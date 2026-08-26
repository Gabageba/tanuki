import type { SortOrder } from '@tanuki/contracts';

export type ChanConfig = {
  id: string;
  isNsfw: boolean;
  sortOrders: SortOrder[];
  /**
   * MANGACHAN uses the shared DLE-engine defaults. HENCHAN paginates `mostviews`/`mostfavorites`
   * with a `sort=manga` query param and a `manga/newest` (not `manga/new`) default path, and its
   * details page has no chapter table — reading happens through a single `/online/<slug>` link.
   * YAOICHAN uses the shared defaults for browsing but its chapter list lives in `div.manga`
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
    sortOrders: ['NEWEST', 'POPULARITY', 'ALPHABETICAL', 'RATING'],
    variant: 'default',
  },
  {
    id: 'HENCHAN',
    isNsfw: true,
    sortOrders: ['NEWEST', 'POPULARITY', 'RATING'],
    variant: 'henchan',
  },
  {
    id: 'YAOICHAN',
    isNsfw: false,
    sortOrders: ['NEWEST'],
    variant: 'yaoichan',
  },
];
