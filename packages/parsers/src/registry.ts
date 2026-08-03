import type { CookieJar } from 'tough-cookie';
import type { Parser, ParserContext, Credentials, Logger } from './core/parser';
import type { RawSourceInfo } from './types';
import { HttpClientImpl, type Timeouts } from './core/http/client';
import { jarFor } from './core/http/cookies';
import { NotImplementedError, UnknownSourceError } from './errors';
import { GROUPLE_CONFIGS } from './sources/grouple/config';
import { createGroupleParser } from './sources/grouple/engine';
import { createDesuParser } from './sources/desu';

export interface SourceDescriptor {
  info: RawSourceInfo;
  domains: [string, ...string[]];
  cookieScope: string;
  defaultHeaders: Record<string, string>;
  create: (ctx: ParserContext) => Parser;
}

function notImplemented(id: string, info: RawSourceInfo): SourceDescriptor['create'] {
  return () => ({
    id,
    info,
    getList: () => {
      throw new NotImplementedError(id);
    },
    getDetails: () => {
      throw new NotImplementedError(id);
    },
    getPages: () => {
      throw new NotImplementedError(id);
    },
    imageHeaders: () => ({}),
  });
}

/**
 * title/contentType/isBroken (the kotatsu-known-broken flag) copied verbatim from the fork's
 * generated enum: tanuki-parsers-redo/build/generated/ksp/.../model/MangaSource.kt. Domains
 * copied from each source's `configKeyDomain`. Only READMANGA_RU..DESUME (phase 1, see
 * docs/03-parsers.md) have a real `create` — everything else is `isImplemented: false` and
 * reports `isBroken: true` regardless of its real kotatsu status, because "not ported yet" and
 * "kotatsu marked it broken" both mean the same thing to sources.service.ts: status 'down'.
 */
interface RawEntry {
  title: string;
  contentType: string;
  kotatsuBroken: boolean;
  domains: [string, ...string[]];
  isImplemented: boolean;
}

// `satisfies` (not `: Record<string, RawEntry>`) keeps the literal key union so `SourceId`
// below is the real 23-member type, not `string` — that's what makes a missing/typo'd source
// id a compile error everywhere else in this file instead of a silent `| undefined`.
const RAW_TABLE = {
  READMANGA_RU: {
    title: 'ReadManga',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['a.zazaza.me', '3.readmanga.ru'],
    isImplemented: true,
  },
  MINTMANGA: {
    title: 'MintManga',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['2.mintmanga.one', '24.mintmanga.one', 'mintmanga.live', 'mintmanga.com'],
    isImplemented: true,
  },
  SELFMANGA: {
    title: 'SelfManga',
    contentType: 'OTHER',
    kotatsuBroken: false,
    domains: ['1.selfmanga.live', 'selfmanga.live'],
    isImplemented: true,
  },
  SEIMANGA: {
    title: 'SeiManga',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['1.seimanga.me', 'seimanga.me'],
    isImplemented: true,
  },
  USAGI: {
    title: 'Usagi',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['web.usagi.one'],
    isImplemented: true,
  },
  ALLHENTAI: {
    title: 'AllHentai',
    contentType: 'HENTAI',
    kotatsuBroken: false,
    domains: ['20.allhen.online', 'z.ahen.me', '24.allhen.online', '2023.allhen.online'],
    isImplemented: true,
  },
  DESUME: {
    title: 'Desu',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['desu.uno', 'x.desu.city', 'desu.city', 'desu.work', 'desu.store', 'desu.win'],
    isImplemented: true,
  },
  MANGALIB: {
    title: 'MangaLib',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['mangalib.org', 'mangalib.me'],
    isImplemented: false,
  },
  HENTAILIB: {
    title: 'HentaiLib',
    contentType: 'HENTAI',
    kotatsuBroken: true,
    domains: ['v1.hentailib.org', 'hentailib.me'],
    isImplemented: false,
  },
  YAOILIB: {
    title: 'SlashLib',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['v2.slashlib.me'],
    isImplemented: false,
  },
  MANGACHAN: {
    title: 'Манга-тян',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['manga-chan.me'],
    isImplemented: false,
  },
  HENCHAN: {
    title: 'Хентай-тян',
    contentType: 'HENTAI',
    kotatsuBroken: false,
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
    isImplemented: false,
  },
  YAOICHAN: {
    title: 'Яой-тян',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: [
      'v9.yaoi-chan.me',
      'v10.yaoi-chan.me',
      'v3.yaoi-chan.me',
      'v2.yaoi-chan.me',
      'v1.yaoi-chan.me',
      'yaoi-chan.me',
    ],
    isImplemented: false,
  },
  REMANGA: {
    title: 'Реманга',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['remanga.org'],
    isImplemented: false,
  },
  NUDEMOON: {
    title: 'Nude-Moon',
    contentType: 'HENTAI',
    kotatsuBroken: false,
    domains: ['b.nude-moon.fun', 'nude-moon.org', 'nude-moon.net'],
    isImplemented: false,
  },
  ACOMICS: {
    title: 'AComics',
    contentType: 'COMICS',
    kotatsuBroken: true,
    domains: ['acomics.ru'],
    isImplemented: false,
  },
  COMX: {
    title: 'Com-X',
    contentType: 'COMICS',
    kotatsuBroken: false,
    domains: ['com-x.life', 'comx.life'],
    isImplemented: false,
  },
  MANGABUFF: {
    title: 'MangaBuff',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['mangabuff.ru'],
    isImplemented: false,
  },
  MANGA_WTF: {
    title: 'MangaWtf',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['manga.wtf'],
    isImplemented: false,
  },
  SENKURO: {
    title: 'Senkuro',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['senkuro.com'],
    isImplemented: false,
  },
  TOMILOLIB: {
    title: 'TomiloLib',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['tomilo-lib.ru'],
    isImplemented: false,
  },
  WAMANGA: {
    title: 'WaManga',
    contentType: 'MANGA',
    kotatsuBroken: false,
    domains: ['wamanga.ru'],
    isImplemented: false,
  },
  ZENMANGA: {
    title: 'ZenManga',
    contentType: 'MANGA',
    kotatsuBroken: true,
    domains: ['inkstory.me'],
    isImplemented: false,
  },
} satisfies Record<string, RawEntry>;

export const SOURCE_IDS = Object.keys(RAW_TABLE).sort() as SourceId[];
export type SourceId = keyof typeof RAW_TABLE;

const GROUPLE_IDS = new Set(GROUPLE_CONFIGS.map((c) => c.id));
/** MANGALIB/HENTAILIB/YAOILIB all hit the same host (api.cdnlibs.org) — see docs plan. */
const LIBSOCIAL_IDS = new Set(['MANGALIB', 'HENTAILIB', 'YAOILIB']);

function cookieScopeFor(id: string): string {
  if (GROUPLE_IDS.has(id)) return 'grouple';
  if (LIBSOCIAL_IDS.has(id)) return 'libsocial';
  return id;
}

function buildDescriptor(id: string, entry: RawEntry): SourceDescriptor {
  const groupleConfig = GROUPLE_CONFIGS.find((c) => c.id === id);
  const info: RawSourceInfo = {
    id,
    title: entry.title,
    locale: 'ru',
    contentType: entry.contentType,
    isBroken: entry.isImplemented ? entry.kotatsuBroken : true,
    sortOrders: entry.isImplemented ? [] : ['UPDATED'],
    isSearchSupported: entry.isImplemented,
    isMultipleTagsSupported: entry.isImplemented,
  };

  if (groupleConfig) {
    return {
      info,
      domains: entry.domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {
        'Accept-Language': 'ru,en-US;q=0.7,en;q=0.3',
        Referer: `https://${entry.domains[0]}/`,
      },
      create: (ctx) => createGroupleParser(groupleConfig, ctx),
    };
  }
  if (id === 'DESUME') {
    return {
      info,
      domains: entry.domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: (ctx) => createDesuParser(ctx),
    };
  }
  return {
    info,
    domains: entry.domains,
    cookieScope: cookieScopeFor(id),
    defaultHeaders: {},
    create: notImplemented(id, info),
  };
}

export const SOURCES: Record<SourceId, SourceDescriptor> = Object.fromEntries(
  SOURCE_IDS.map((id) => [id, buildDescriptor(id, RAW_TABLE[id]!)]),
) as Record<SourceId, SourceDescriptor>;

export function listSources(): RawSourceInfo[] {
  return SOURCE_IDS.map((id) => SOURCES[id].info);
}

export interface ParsersRegistry {
  listSources(): RawSourceInfo[];
  get(sourceId: string): Parser;
  imageHeaders(sourceId: string, imageUrl: string): Record<string, string>;
  init(): Promise<void>;
  close(): Promise<void>;
}

export interface RegistryOptions {
  credentials: Credentials;
  logger: Logger;
  timeouts?: Partial<Timeouts>;
}

/**
 * Parser instances are long-lived — one per known source, created eagerly here rather than
 * per-request (as the Kotlin sidecar did via `newParserInstance` on every HTTP call). That's
 * what makes state like Grouple's `cachedPagesServer` or Desu's tag cache worth having at all.
 */
export function createRegistry(opts: RegistryOptions): ParsersRegistry {
  const jars = new Map<string, CookieJar>();
  const parsers = new Map<string, Parser>();

  for (const id of SOURCE_IDS) {
    const descriptor = SOURCES[id];
    const jar = jarFor(descriptor.cookieScope);
    jars.set(id, jar);
    const http = new HttpClientImpl({
      sourceId: id,
      jar,
      defaultHeaders: descriptor.defaultHeaders,
      timeouts: opts.timeouts,
    });
    const ctx: ParserContext = {
      http,
      domain: descriptor.domains[0],
      jar,
      logger: opts.logger,
      credentials: opts.credentials,
    };
    parsers.set(id, descriptor.create(ctx));
  }

  return {
    listSources,
    get(sourceId) {
      const parser = parsers.get(sourceId);
      if (!parser) throw new UnknownSourceError(sourceId);
      return parser;
    },
    imageHeaders(sourceId, imageUrl) {
      return parsers.get(sourceId)?.imageHeaders(imageUrl) ?? {};
    },
    async init() {
      await Promise.allSettled(
        [...parsers.values()].map(async (parser) => {
          try {
            await parser.init?.();
          } catch (err) {
            opts.logger.warn(
              `init() failed for ${parser.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }),
      );
    },
    async close() {
      await Promise.allSettled(
        [...parsers.values()].map((parser) => parser.close?.() ?? Promise.resolve()),
      );
    },
  };
}
