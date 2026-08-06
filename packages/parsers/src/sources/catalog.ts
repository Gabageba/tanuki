/**
 * Central per-source catalog now lives in @tanuki/contracts (source-catalog.ts) so the web app
 * can depend on id/title/icon data without pulling in this package's server-only deps (cheerio,
 * undici, tough-cookie). Re-exported here under the historical `../catalog` path so config
 * modules (GroupleConfig, ChanConfig, ...) keep importing it without risking a circular import
 * back into registry.ts.
 */
export {
  SOURCE_CATALOG,
  SOURCE_ID,
  SOURCE_IDS,
  catalogEntryFor,
  type CatalogEntry,
  type SourceId,
} from '@tanuki/contracts';
