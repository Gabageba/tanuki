import { SOURCE_ID } from '../catalog';

/**
 * Tag/character taxonomy routes for one content type — verified live for both comics and
 * hentai_manga (see engine.ts's fetchTaxonomyOptions/fetchTaxonomyPage).
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
  /** Same shape as `tagListPath`, for the series taxonomy — a series' own browse route lives at a
   *  different path than this type's actual node prefix (hentai_manga: series `/manga/<slug>`
   *  vs. nodes `/hentai_manga/<slug>`; comics: both happen to be `/comics/<slug>`, verified live
   *  that's a coincidence of this type's URL scheme, not something to rely on). */
  seriesListPath: string;
  seriesPathPrefix: string;
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
  /** Detail-page "Section:" selector — the franchise/original work this node's part of (Drupal's
   *  field name calls it a "group", the label reads "Section:") — verified live for both types,
   *  same split as authorSelector: comics uses `field-com-group`, hentai_manga uses
   *  `field-hentai-com-group`. Its link target is this type's own `seriesPathPrefix` route, but
   *  it's parsed for its link text (into RawManga.series), not its href. */
  seriesSelector: string;
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
    seriesSelector: '.field-name-field-com-group a',
    filters: {
      tagListPath: '/category_comic?rule34=1',
      tagPathPrefix: '/category/',
      characterListPath: '/characters',
      characterPathPrefix: '/characters/',
      seriesListPath: '/comics?rule34=3',
      seriesPathPrefix: '/comics/',
    },
  },
  {
    id: SOURCE_ID.MULTPORN_HENTAI,
    typeParam: '3',
    pathPrefix: '/hentai_manga/',
    listTagSelector: '.views-field-field-h-category a',
    detailTagSelector: '.field-name-field-h-category a',
    authorSelector: '.field-name-field-author-hentai a',
    seriesSelector: '.field-name-field-hentai-com-group a',
    filters: {
      tagListPath: '/manga_tags?rule34=3',
      tagPathPrefix: '/category_hentai/',
      characterListPath: '/characters_hentai?r=2',
      characterPathPrefix: '/characters_hentai/',
      seriesListPath: '/manga?rule34=3',
      seriesPathPrefix: '/manga/',
    },
  },
];
