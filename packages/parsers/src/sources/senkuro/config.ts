import { SOURCE_ID, type SourceId } from '../catalog';

export type SenkuroConfig = {
  id: SourceId;
  /** GraphQL endpoint serving both the `mangas` connection and the `mangaTachiyomi*` queries. */
  apiEndpoint: string;
  /** Value of the `app-id` request header — this, not the host, selects the catalog. */
  appId: string;
  /** Блок «Самое читаемое» на главной. У Senkognito `mangaPopularByPeriod` не смотрит на
   *  app-id и отдаёт тайтлы Senkuro (сайт и сам их так показывает) — в его каталоге их не
   *  открыть, поэтому там блока нет. */
  hasPopularHome: boolean;
};

// title/domains/contentType live in SOURCE_CATALOG (../catalog) — look them up by id, don't
// duplicate here.
//
// SENKURO and SENKOGNITO are two separate sites with two disjoint catalogs, served by one
// GraphQL backend that partitions them by the `app-id` request header (verified live):
//
//   app-id 4026531840100 → Senkuro,    12842 titles
//   app-id 5033164800100 → Senkognito,   693 titles
//
// The header wins over the hostname — api.senkuro.com, api.senkuro.me and api.senkognito.com all
// answer with whichever catalog the app-id names, and a title from the other catalog is simply
// invisible (`mangaTachiyomiInfo` returns null for it). Omitting the header falls back to
// Senkuro's catalog, which is what used to make SENKOGNITO serve Senkuro's titles; an unknown
// app-id returns an empty catalog, so never send a guessed value. `app-version` is not required.
export const SENKURO_CONFIGS: SenkuroConfig[] = [
  {
    id: SOURCE_ID.SENKURO,
    apiEndpoint: 'https://api.senkuro.com/graphql',
    appId: '4026531840100',
    hasPopularHome: true,
  },
  {
    id: SOURCE_ID.SENKOGNITO,
    apiEndpoint: 'https://api.senkognito.com/graphql',
    appId: '5033164800100',
    hasPopularHome: false,
  },
];
