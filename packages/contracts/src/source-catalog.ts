import { SOURCE_CONTENT_TYPE, type SourceContentType } from './source';
import type { EnumLiteralsOf } from './utils';

/**
 * Central per-source catalog — the single source of truth for every source's title, canonical
 * domains, contentType, and isBroken status. title/contentType copied verbatim from the fork's
 * generated enum: tanuki-parsers-redo/build/generated/ksp/.../model/MangaSource.kt. Domains
 * copied from each source's `configKeyDomain`. isBroken drives the 'down' status surfaced by
 * sources.service.ts.
 *
 * Lives in @tanuki/contracts (not @tanuki/parsers) so both the Node parsers engine and the web
 * app can depend on the id/title/icon data without the web app pulling in parsers' server-only
 * deps (cheerio, undici, tough-cookie).
 *
 * Source-specific configs (GroupleConfig, ChanConfig, LibSocialConfig, MultpornConfig,
 * SenkuroConfig) only carry their own engine-specific fields (siteId, authGateway, sortOrders,
 * ...) and look up title/domains from here by id — so a URL or title only ever needs to change in
 * one place.
 */
export type CatalogEntry = {
  title: string;
  contentType: SourceContentType;
  isBroken: boolean;
  /** Source serves 18+ content — drives the isAdult flag surfaced by sources.service.ts. */
  isAdult: boolean;
  /** Source is blocked for RU IPs — drives the requiresVpn flag surfaced by sources.service.ts. */
  requiresVpn: boolean;
  domains: [string, ...string[]];
};

// `satisfies` (not `: Record<string, CatalogEntry>`) keeps the literal key union so `SourceId`
// below is the real 28-member type, not `string` — that's what makes a missing/typo'd source
// id a compile error everywhere else in the codebase instead of a silent `| undefined`.
export const SOURCE_CATALOG = {
  READMANGA_RU: {
    title: 'ReadManga',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['a.zazaza.me', '3.readmanga.ru'],
  },
  MINTMANGA: {
    title: 'MintManga',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['2.mintmanga.one', '24.mintmanga.one', 'mintmanga.live', 'mintmanga.com'],
  },
  SELFMANGA: {
    title: 'SelfManga',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['1.selfmanga.live', 'selfmanga.live'],
  },
  SEIMANGA: {
    title: 'SeiManga',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['1.seimanga.me', 'seimanga.me'],
  },
  USAGI: {
    title: 'Usagi',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['web.usagi.one'],
  },
  ALLHENTAI: {
    title: 'AllHentai',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: false,
    domains: ['20.allhen.online', 'z.ahen.me', '24.allhen.online', '2023.allhen.online'],
  },
  DESUME: {
    title: 'Desu',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['desu.uno', 'x.desu.city', 'desu.city', 'desu.work', 'desu.store', 'desu.win'],
  },
  MANGALIB: {
    title: 'MangaLib',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['mangalib.org', 'mangalib.me'],
  },
  HENTAILIB: {
    title: 'HentaiLib',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['v1.hentailib.org', 'hentailib.me'],
  },
  YAOILIB: {
    title: 'SlashLib',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['v2.slashlib.me'],
  },
  MANGACHAN: {
    title: 'Манга-тян',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: true,
    domains: ['im.manga-chan.me'],
  },
  HENCHAN: {
    title: 'Хентай-тян',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
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
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
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
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['remanga.org'],
  },
  NUDEMOON: {
    title: 'Nude-Moon',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['g.nude-moon.fun', 'nude-moon.net', 'nude-moon.org', 'b.nude-moon.fun'],
  },
  ACOMICS: {
    title: 'AComics',
    contentType: SOURCE_CONTENT_TYPE.comics,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['acomics.ru'],
  },
  COMX: {
    title: 'Com-X',
    contentType: SOURCE_CONTENT_TYPE.comics,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['com-x.life', 'comx.life'],
  },
  MANGABUFF: {
    title: 'MangaBuff',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['mangabuff.ru'],
  },
  SENKURO: {
    title: 'Senkuro',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: true,
    // ne.senkuro.com is a mirror hostname for the same frontend (senkuro.com is ISP-blocked for
    // some RU users); both hit the same api.senkuro.com backend, see sources/senkuro/config.ts.
    domains: ['senkuro.me', 'ne.senkuro.com', 'senkuro.com'],
  },
  SENKOGNITO: {
    title: 'Senkognito',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    // Senkuro's 18+ site: its own catalog, disjoint from SENKURO's, served by the shared backend
    // and selected by the `app-id` header. Same mirror pattern as senkuro.* — ne.* is the
    // unblocked hostname. See sources/senkuro/config.ts for how the two are split.
    domains: ['ne.senkognito.com', 'senkognito.com'],
  },
  TOMILOLIB: {
    title: 'TomiloLib',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['tomilo-lib.ru'],
  },
  WAMANGA: {
    title: 'WaManga',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['wamanga.ru'],
  },
  INKSTORY: {
    title: 'Inkstory',
    contentType: SOURCE_CONTENT_TYPE.manga,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['inkstory.net'],
  },
  HENTAICHAN_CC: {
    title: 'HentaiChan',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['hentaichan.cc'],
  },
  SEXKOMIX2: {
    title: 'SexKomix2',
    contentType: SOURCE_CONTENT_TYPE.comics,
    isBroken: false,
    isAdult: true,
    requiresVpn: false,
    domains: ['super.sexkomix22.com', 'sexkomix2.com'],
  },
  MULTPORN: {
    title: 'MultPorn',
    contentType: SOURCE_CONTENT_TYPE.comics,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['multporn.net'],
  },
  MULTPORN_HENTAI: {
    title: 'MultPorn Hentai',
    contentType: SOURCE_CONTENT_TYPE.hentai,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['multporn.net'],
  },
} satisfies Record<string, CatalogEntry>;

/**
 * Идентификаторы источников как перечисление (id → id) — чтобы потребителям (например
 * EnvSchema в apps/api) не приходилось приводить массив строк к литеральному типу руками.
 */
export const SOURCE_ID = Object.fromEntries(Object.keys(SOURCE_CATALOG).map((id) => [id, id])) as {
  [K in keyof typeof SOURCE_CATALOG]: K;
};
export type SourceId = EnumLiteralsOf<typeof SOURCE_ID>;

export const SOURCE_IDS = Object.keys(SOURCE_ID).sort() as SourceId[];

/**
 * Looks up a catalog entry by id for source-specific configs (GroupleConfig.id etc.), which
 * stay typed as plain `string` — narrowing them to `SourceId` ripples through every object they
 * flow into (e.g. RawTag.source) and forces the whole engine to adopt the literal union.
 */
export const catalogEntryFor = (id: string): CatalogEntry => {
  const entry = (SOURCE_CATALOG as Record<string, CatalogEntry>)[id];
  if (!entry) throw new Error(`Unknown source id: ${id}`);
  return entry;
};
