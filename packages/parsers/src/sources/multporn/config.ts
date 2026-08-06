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
};

// title/domains/contentType live in SOURCE_CATALOG (../catalog) — look them up by id, don't
// duplicate here.
export const MULTPORN_CONFIGS: MultpornConfig[] = [
  {
    id: 'MULTPORN',
    typeParam: '1',
    pathPrefix: '/comics/',
    listTagSelector: '.views-field-field-category a',
    detailTagSelector: '.field-name-field-category a',
    authorSelector: '.field-name-field-author a',
  },
  {
    id: 'MULTPORN_HENTAI',
    typeParam: '3',
    pathPrefix: '/hentai_manga/',
    listTagSelector: '.views-field-field-h-category a',
    detailTagSelector: '.field-name-field-h-category a',
    authorSelector: '.field-name-field-author-hentai a',
  },
];
