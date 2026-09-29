import {
  SOURCE_AUTH_FAMILY,
  SOURCE_CONTENT_TYPE,
  type SourceAuthFamily,
  type SourceContentType,
} from './source';
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
  /** Source's brand color — used for its ribbon/accent in the web UI. */
  color: string;
  /** null — источник открыт без входа. */
  authFamily: SourceAuthFamily | null;
};

// `satisfies` (not `: Record<string, CatalogEntry>`) keeps the literal key union so `SourceId`
// below is the real 28-member type, not `string` — that's what makes a missing/typo'd source
// id a compile error everywhere else in the codebase instead of a silent `| undefined`.
export const SOURCE_CATALOG = {
  readmanga_ru: {
    title: 'ReadManga',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['a.zazaza.me', '3.readmanga.ru'],
    color: '#1847C5',
    authFamily: SOURCE_AUTH_FAMILY.GROUPLE,
  },
  mintmanga: {
    title: 'MintManga',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['2.mintmanga.one', '24.mintmanga.one', 'mintmanga.live', 'mintmanga.com'],
    color: '#CBF446',
    authFamily: SOURCE_AUTH_FAMILY.GROUPLE,
  },
  selfmanga: {
    title: 'SelfManga',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['1.selfmanga.live', 'selfmanga.live'],
    color: '#ECD166',
    authFamily: SOURCE_AUTH_FAMILY.GROUPLE,
  },
  seimanga: {
    title: 'SeiManga',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['1.seimanga.me', 'seimanga.me'],
    color: '#75B9F7',
    authFamily: SOURCE_AUTH_FAMILY.GROUPLE,
  },
  usagi: {
    title: 'Usagi',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['web.usagi.one'],
    color: '#0872AC',
    authFamily: SOURCE_AUTH_FAMILY.GROUPLE,
  },
  allhentai: {
    title: 'AllHentai',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: false,
    domains: ['20.allhen.online', 'z.ahen.me', '24.allhen.online', '2023.allhen.online'],
    color: '#CA1717',
    authFamily: SOURCE_AUTH_FAMILY.ALLHENTAI,
  },
  desume: {
    title: 'Desu',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['desu.uno', 'x.desu.city', 'desu.city', 'desu.work', 'desu.store', 'desu.win'],
    color: '#915806',
    authFamily: null,
  },
  mangalib: {
    title: 'MangaLib',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['mangalib.org', 'mangalib.me'],
    color: '#FF8C02',
    authFamily: SOURCE_AUTH_FAMILY.LIBSOCIAL,
  },
  hentailib: {
    title: 'HentaiLib',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['v1.hentailib.org', 'hentailib.me'],
    color: '#FF0048',
    authFamily: SOURCE_AUTH_FAMILY.LIBSOCIAL,
  },
  yaoilib: {
    title: 'SlashLib',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['v2.slashlib.me'],
    color: '#D91A60',
    authFamily: SOURCE_AUTH_FAMILY.LIBSOCIAL,
  },
  mangachan: {
    title: 'Манга-тян',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: true,
    domains: ['im.manga-chan.me', 'manga-chan.me'],
    color: '#399DB7',
    authFamily: null,
  },
  henchan: {
    title: 'Хентай-тян',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    // Проверено вживую 9 сентября 2026: domains[0] (x5.h-chan.me) редиректит на x1.h-chan.me,
    // который отдаёт 404 на каталог; остальные зеркала в списке формально живы (200), но за
    // FingerprintJS-гейтом (JS-редирект по результату фингерпринта) — то же самое, о чём уже
    // предупреждает комментарий у chanSortField в sources/chan/engine.ts. Ни одно зеркало из
    // списка сейчас не читается undici-клиентом, поэтому источник — как YAOICHAN/COMX/ACOMICS.
    isBroken: true,
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
    color: '#9EBE75',
    authFamily: null,
  },
  yaoichan: {
    title: 'Яой-тян',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
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
    color: '#DC60A1',
    authFamily: null,
  },
  remanga: {
    title: 'Реманга',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['remanga.org'],
    color: '#000000',
    authFamily: null,
  },
  nudemoon: {
    title: 'Nude-Moon',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['g.nude-moon.fun', 'nude-moon.net', 'nude-moon.org', 'b.nude-moon.fun'],
    color: '#ED0102',
    authFamily: null,
  },
  acomics: {
    title: 'AComics',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['acomics.ru'],
    color: '#D31434',
    authFamily: null,
  },
  comx: {
    title: 'Com-X',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    isBroken: true,
    isAdult: false,
    requiresVpn: false,
    domains: ['com-x.life', 'comx.life'],
    color: '#FFA331',
    authFamily: null,
  },
  mangabuff: {
    title: 'MangaBuff',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['mangabuff.ru'],
    color: '#8C00FF',
    authFamily: null,
  },
  senkuro: {
    title: 'Senkuro',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: true,
    // ne.senkuro.com is a mirror hostname for the same frontend (senkuro.com is ISP-blocked for
    // some RU users); both hit the same api.senkuro.com backend, see sources/senkuro/config.ts.
    domains: ['senkuro.me', 'ne.senkuro.com', 'senkuro.com'],
    color: '#FE6E00',
    authFamily: null,
  },
  senkognito: {
    title: 'Senkognito',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    // Senkuro's 18+ site: its own catalog, disjoint from SENKURO's, served by the shared backend
    // and selected by the `app-id` header. Same mirror pattern as senkuro.* — ne.* is the
    // unblocked hostname. See sources/senkuro/config.ts for how the two are split.
    domains: ['ne.senkognito.com', 'senkognito.com'],
    color: '#FE6E00',
    authFamily: null,
  },
  tomilolib: {
    title: 'TomiloLib',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['tomilo-lib.ru'],
    color: '#DC3933',
    authFamily: null,
  },
  wamanga: {
    title: 'WaManga',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['wamanga.ru'],
    color: '#5A5EE7',
    authFamily: null,
  },
  inkstory: {
    title: 'Inkstory',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    isBroken: false,
    isAdult: false,
    requiresVpn: false,
    domains: ['inkstory.net'],
    color: '#2B7FFF',
    authFamily: null,
  },
  hentaichan_cc: {
    title: 'HentaiChan',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['hentaichan.cc'],
    color: '#5CA656',
    authFamily: null,
  },
  sexkomix2: {
    title: 'SexKomix2',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    isBroken: false,
    isAdult: true,
    requiresVpn: false,
    domains: ['super.sexkomix22.com', 'sexkomix2.com'],
    color: '#FF3248',
    authFamily: null,
  },
  multporn: {
    title: 'MultPorn',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['multporn.net'],
    color: '#A42511',
    authFamily: null,
  },
  multporn_hentai: {
    title: 'MultPorn Hentai',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    isBroken: false,
    isAdult: true,
    requiresVpn: true,
    domains: ['multporn.net'],
    color: '#A42511',
    authFamily: null,
  },
} satisfies Record<string, CatalogEntry>;

/**
 * Идентификаторы источников как перечисление (SCREAM_CASE → snake_case id) — чтобы потребителям
 * (например EnvSchema в apps/api) не приходилось приводить массив строк к литеральному типу
 * руками, а вызывающему коду — писать `SOURCE_ID.READMANGA_RU` вместо сырого `'readmanga_ru'`.
 */
export const SOURCE_ID = Object.fromEntries(
  Object.keys(SOURCE_CATALOG).map((id) => [id.toUpperCase(), id]),
) as { [K in keyof typeof SOURCE_CATALOG as Uppercase<K>]: K };
export type SourceId = EnumLiteralsOf<typeof SOURCE_ID>;

export const SOURCE_IDS = Object.values(SOURCE_ID).sort() as SourceId[];

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
