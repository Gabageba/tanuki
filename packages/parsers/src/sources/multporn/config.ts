import { SOURCE_ID } from '../catalog';

/**
 * Tag/character taxonomy routes for one content type — verified live only for hentai_manga
 * (see engine.ts's fetchTaxonomyOptions/fetchTaxonomyPage). Comics almost certainly has its own
 * equivalent pair (its listing rows already carry `/category/<slug>` links, see `listTagSelector`
 * below), but the full-listing pages that would enumerate every term (this type's `/manga_tags`
 * equivalent) haven't been found/verified live, so it stays unwired rather than guessed at.
 */
export type MultpornFilterConfig = {
  /** Full, paginated (`?page=N`) listing of every tag term for this type — `/manga_tags` for
   *  hentai_manga (its own page title reads "Hentai Manga by tags"), ~78 terms across 3 pages. */
  tagListPath: string;
  /** Prefix of a tag term's own browse-listing route (`/category_hentai/<slug>`) — replaces
   *  `/new` as the listing URL once a tag is selected. Verified live that multiple slugs can't be
   *  combined in one request (`/category_hentai/a+b` and `/category_hentai/a,b` both 404) —
   *  unlike chan's `+`-joined tags, this taxonomy is single-select only. */
  tagPathPrefix: string;
  /** Same shape as `tagListPath`, for the character taxonomy — `/characters_hentai`, ~1600+
   *  terms across 11 pages. */
  characterListPath: string;
  characterPathPrefix: string;
};

export type MultpornConfig = {
  id: string;
  /** Drupal content-type filter value for the `/new?type=` browse listing. */
  typeParam: string;
  /** Node alias prefix for this type — also used to pick this type's rows out of `/search`'s
   *  mixed-type results (comics, hentai manga, pictures, video, games, ... all share one view). */
  pathPrefix: string;
  /** Listing-row tag selector: Comics and Hentai manga expose categories under different
   *  Views field names even though the row markup is otherwise identical. */
  listTagSelector: string;
  /** Detail-page tag selector — same split as `listTagSelector`. */
  detailTagSelector: string;
  /** Detail-page author selector — Comics and Hentai manga use separate author taxonomies. */
  authorSelector: string;
  /** Omitted where this type's taxonomy routes aren't verified live — see MultpornFilterConfig. */
  filters?: MultpornFilterConfig;
};

// title/domains/contentType live in SOURCE_CATALOG (../catalog) — look them up by id, don't
// duplicate here.
export const MULTPORN_CONFIGS: MultpornConfig[] = [
  {
    id: SOURCE_ID.MULTPORN,
    typeParam: '1',
    pathPrefix: '/comics/',
    listTagSelector: '.views-field-field-category a',
    detailTagSelector: '.field-name-field-category a',
    authorSelector: '.field-name-field-author a',
  },
  {
    id: SOURCE_ID.MULTPORN_HENTAI,
    typeParam: '3',
    pathPrefix: '/hentai_manga/',
    listTagSelector: '.views-field-field-h-category a',
    detailTagSelector: '.field-name-field-h-category a',
    authorSelector: '.field-name-field-author-hentai a',
    filters: {
      tagListPath: '/manga_tags?rule34=3',
      tagPathPrefix: '/category_hentai/',
      characterListPath: '/characters_hentai?r=2',
      characterPathPrefix: '/characters_hentai/',
    },
  },
];
