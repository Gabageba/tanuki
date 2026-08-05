/**
 * Central per-source catalog — the single source of truth for every source's title, canonical
 * domains, contentType, and isBroken status. title/contentType copied verbatim from the fork's
 * generated enum: tanuki-parsers-redo/build/generated/ksp/.../model/MangaSource.kt. Domains
 * copied from each source's `configKeyDomain`. isBroken drives the 'down' status surfaced by
 * sources.service.ts.
 *
 * Source-specific configs (GroupleConfig, ChanConfig, LibSocialConfig, MultpornConfig,
 * SenkuroConfig) only
 * carry their own engine-specific fields (siteId, authGateway, sortOrders, ...) and look up
 * title/domains from here by id — so a URL or title only ever needs to change in one place.
 * This file has no imports of its own so every config module can depend on it without risking
 * a circular import back into registry.ts.
 */
export interface CatalogEntry {
  title: string;
  contentType: string;
  isBroken: boolean;
  domains: [string, ...string[]];
}

// `satisfies` (not `: Record<string, CatalogEntry>`) keeps the literal key union so `SourceId`
// below is the real 28-member type, not `string` — that's what makes a missing/typo'd source
// id a compile error everywhere else in the codebase instead of a silent `| undefined`.
export const SOURCE_CATALOG = {
  READMANGA_RU: {
    title: 'ReadManga',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['a.zazaza.me', '3.readmanga.ru'],
  },
  MINTMANGA: {
    title: 'MintManga',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['2.mintmanga.one', '24.mintmanga.one', 'mintmanga.live', 'mintmanga.com'],
  },
  SELFMANGA: {
    title: 'SelfManga',
    contentType: 'OTHER',
    isBroken: false,
    domains: ['1.selfmanga.live', 'selfmanga.live'],
  },
  SEIMANGA: {
    title: 'SeiManga',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['1.seimanga.me', 'seimanga.me'],
  },
  USAGI: {
    title: 'Usagi',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['web.usagi.one'],
  },
  ALLHENTAI: {
    title: 'AllHentai',
    contentType: 'HENTAI',
    isBroken: false,
    domains: ['20.allhen.online', 'z.ahen.me', '24.allhen.online', '2023.allhen.online'],
  },
  DESUME: {
    title: 'Desu',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['desu.uno', 'x.desu.city', 'desu.city', 'desu.work', 'desu.store', 'desu.win'],
  },
  MANGALIB: {
    title: 'MangaLib',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['mangalib.org', 'mangalib.me'],
  },
  HENTAILIB: {
    title: 'HentaiLib',
    contentType: 'HENTAI',
    isBroken: false,
    domains: ['v1.hentailib.org', 'hentailib.me'],
  },
  YAOILIB: {
    title: 'SlashLib',
    contentType: 'MANGA',
    isBroken: true,
    domains: ['v2.slashlib.me'],
  },
  MANGACHAN: {
    title: 'Манга-тян',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['manga-chan.me'],
  },
  HENCHAN: {
    title: 'Хентай-тян',
    contentType: 'HENTAI',
    isBroken: false,
    domains: [
      'x5.h-chan.me',
      'xxxx.henchan.pro',
      'xxl.hentaichan.live',
      'xxx.henchan.pro',
      'y.hentaichan.live',
      'xx.hentaichan.live',
      'x.henchan.pro',
      'hentaichan.live',
    ],
  },
  YAOICHAN: {
    title: 'Яой-тян',
    contentType: 'MANGA',
    isBroken: true,
    domains: [
      'v9.yaoi-chan.me',
      'v10.yaoi-chan.me',
      'v3.yaoi-chan.me',
      'v2.yaoi-chan.me',
      'v1.yaoi-chan.me',
      'yaoi-chan.me',
    ],
  },
  REMANGA: {
    title: 'Реманга',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['remanga.org'],
  },
  NUDEMOON: {
    title: 'Nude-Moon',
    contentType: 'HENTAI',
    isBroken: false,
    domains: ['g.nude-moon.fun', 'nude-moon.net', 'nude-moon.org', 'b.nude-moon.fun'],
  },
  ACOMICS: {
    title: 'AComics',
    contentType: 'COMICS',
    isBroken: true,
    domains: ['acomics.ru'],
  },
  COMX: {
    title: 'Com-X',
    contentType: 'COMICS',
    isBroken: true,
    domains: ['com-x.life', 'comx.life'],
  },
  MANGABUFF: {
    title: 'MangaBuff',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['mangabuff.ru'],
  },
  SENKURO: {
    title: 'Senkuro',
    contentType: 'MANGA',
    isBroken: false,
    // ne.senkuro.com is a mirror hostname for the same frontend (senkuro.com is ISP-blocked for
    // some RU users); both hit the same api.senkuro.com backend, see sources/senkuro/config.ts.
    domains: ['senkuro.me', 'ne.senkuro.com', 'senkuro.com'],
  },
  SENKOGNITO: {
    title: 'Senkognito',
    contentType: 'HENTAI',
    isBroken: false,
    // Senkuro's 18+ site: its own catalog, disjoint from SENKURO's, served by the shared backend
    // and selected by the `app-id` header. Same mirror pattern as senkuro.* — ne.* is the
    // unblocked hostname. See sources/senkuro/config.ts for how the two are split.
    domains: ['ne.senkognito.com', 'senkognito.com'],
  },
  TOMILOLIB: {
    title: 'TomiloLib',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['tomilo-lib.ru'],
  },
  WAMANGA: {
    title: 'WaManga',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['wamanga.ru'],
  },
  INKSTORY: {
    title: 'Inkstory',
    contentType: 'MANGA',
    isBroken: false,
    domains: ['inkstory.net'],
  },
  HENTAICHAN_CC: {
    title: 'HentaiChan',
    contentType: 'HENTAI',
    isBroken: false,
    domains: ['hentaichan.cc'],
  },
  SEXKOMIX2: {
    title: 'SexKomix2',
    contentType: 'COMICS',
    isBroken: false,
    domains: ['super.sexkomix22.com', 'sexkomix2.com'],
  },
  MULTPORN: {
    title: 'MultPorn',
    contentType: 'COMICS',
    isBroken: false,
    domains: ['multporn.net'],
  },
  MULTPORN_HENTAI: {
    title: 'MultPorn Hentai',
    contentType: 'HENTAI',
    isBroken: false,
    domains: ['multporn.net'],
  },
} satisfies Record<string, CatalogEntry>;

export type SourceId = keyof typeof SOURCE_CATALOG;
export const SOURCE_IDS = Object.keys(SOURCE_CATALOG).sort() as SourceId[];

/**
 * Looks up a catalog entry by id for source-specific configs (GroupleConfig.id etc.), which
 * stay typed as plain `string` — narrowing them to `SourceId` ripples through every object they
 * flow into (e.g. RawTag.source) and forces the whole engine to adopt the literal union.
 */
export function catalogEntryFor(id: string): CatalogEntry {
  const entry = (SOURCE_CATALOG as Record<string, CatalogEntry>)[id];
  if (!entry) throw new Error(`Unknown source id: ${id}`);
  return entry;
}
