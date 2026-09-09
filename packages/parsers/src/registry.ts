import type { CookieJar } from 'tough-cookie';
import type { Parser, ParserContext, Credentials, Logger } from './core/parser';
import type { RawSourceInfo } from './types';
import { HttpClientImpl, type Timeouts } from './core/http/client';
import { UserAgents } from './core/http/user-agents';
import { jarFor } from './core/http/cookies';
import { NotImplementedError, UnknownSourceError } from './errors';
import { SOURCE_LOCALE } from '@tanuki/contracts';
import { SOURCE_CATALOG, SOURCE_ID, SOURCE_IDS, type SourceId } from './sources/catalog';
export { SOURCE_ID, SOURCE_IDS, type SourceId } from './sources/catalog';
import { GROUPLE_CONFIGS } from './sources/grouple/config';
import { createGroupleParser } from './sources/grouple/engine';
import { createDesuParser } from './sources/desu';
import { LIBSOCIAL_CONFIGS } from './sources/libsocial/config';
import { createLibSocialParser } from './sources/libsocial/engine';
import { CHAN_CONFIGS } from './sources/chan/config';
import { createChanParser } from './sources/chan/engine';
import { createRemangaParser } from './sources/remanga';
import { createMangaBuffParser } from './sources/mangabuff';
import { createInkStoryParser } from './sources/inkstory';
import { createComxParser } from './sources/comx';
import { createTomiloLibParser } from './sources/tomilolib';
import { createWaMangaParser } from './sources/wamanga';
import { createNudeMoonParser } from './sources/nudemoon';
import { createAComicsParser } from './sources/acomics';
import { SENKURO_CONFIGS } from './sources/senkuro/config';
import { createSenkuroParser } from './sources/senkuro/engine';
import { createHentaichanCcParser } from './sources/hentaichancc';
import { createSexKomix2Parser } from './sources/sexkomix2';
import { MULTPORN_CONFIGS } from './sources/multporn/config';
import { createMultpornParser } from './sources/multporn/engine';

export type SourceDescriptor = {
  info: RawSourceInfo;
  domains: [string, ...string[]];
  cookieScope: string;
  defaultHeaders: Record<string, string>;
  create: (ctx: ParserContext) => Parser;
};

const notImplemented = (id: string, info: RawSourceInfo): SourceDescriptor['create'] => {
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
};

const GROUPLE_IDS = new Set(GROUPLE_CONFIGS.map((c) => c.id));
/** mangalib/hentailib/yaoilib all hit the same host (api.cdnlibs.org) — see docs plan. */
const LIBSOCIAL_IDS = new Set<string>([SOURCE_ID.MANGALIB, SOURCE_ID.HENTAILIB, SOURCE_ID.YAOILIB]);
/** Sources whose parser implements getFilters() — mirrored into RawSourceInfo.isFiltersSupported. */
const FILTERS_SUPPORTED_IDS = new Set<SourceId>([
  SOURCE_ID.DESUME,
  SOURCE_ID.INKSTORY,
  SOURCE_ID.MANGABUFF,
  SOURCE_ID.MANGACHAN,
  SOURCE_ID.HENCHAN,
  SOURCE_ID.YAOICHAN,
  SOURCE_ID.MANGALIB,
  SOURCE_ID.HENTAILIB,
  SOURCE_ID.YAOILIB,
  SOURCE_ID.MULTPORN_HENTAI,
]);

const cookieScopeFor = (id: string): string => {
  if (GROUPLE_IDS.has(id)) return 'grouple';
  if (LIBSOCIAL_IDS.has(id)) return 'libsocial';
  return id;
};

/** Sources with a single id, no shared-engine config to pick between. */
const SINGLE_SOURCE_FACTORIES: Record<string, (ctx: ParserContext) => Parser> = {
  [SOURCE_ID.DESUME]: createDesuParser,
  [SOURCE_ID.REMANGA]: createRemangaParser,
  [SOURCE_ID.MANGABUFF]: createMangaBuffParser,
  [SOURCE_ID.INKSTORY]: createInkStoryParser,
  [SOURCE_ID.COMX]: createComxParser,
  [SOURCE_ID.TOMILOLIB]: createTomiloLibParser,
  [SOURCE_ID.WAMANGA]: createWaMangaParser,
  [SOURCE_ID.NUDEMOON]: createNudeMoonParser,
  [SOURCE_ID.ACOMICS]: createAComicsParser,
  [SOURCE_ID.HENTAICHAN_CC]: createHentaichanCcParser,
  [SOURCE_ID.SEXKOMIX2]: createSexKomix2Parser,
};

const buildDescriptor = (id: SourceId): SourceDescriptor => {
  const catalogEntry = SOURCE_CATALOG[id];
  const { title, domains } = catalogEntry;
  const groupleConfig = GROUPLE_CONFIGS.find((c) => c.id === id);
  const libSocialConfig = LIBSOCIAL_CONFIGS.find((c) => c.id === id);
  const chanConfig = CHAN_CONFIGS.find((c) => c.id === id);
  const multpornConfig = MULTPORN_CONFIGS.find((c) => c.id === id);
  const senkuroConfig = SENKURO_CONFIGS.find((c) => c.id === id);

  const info: RawSourceInfo = {
    id,
    title,
    domain: domains[0],
    locale: SOURCE_LOCALE.RU,
    contentType: catalogEntry.contentType,
    isBroken: catalogEntry.isBroken,
    isAdult: catalogEntry.isAdult,
    requiresVpn: catalogEntry.requiresVpn,
    sortOrders: [],
    supportsDirection: false,
    isSearchSupported: true,
    isMultipleTagsSupported: true,
    isFiltersSupported: FILTERS_SUPPORTED_IDS.has(id),
  };

  if (groupleConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      // The network's antibot now blocks bare/undici-default User-Agents on every page, not
      // just images (see UserAgents.GROUPLE_ARORA) — verified against mintmanga.com and
      // 20.allhen.online both returning 402 without it.
      defaultHeaders: {
        'Accept-Language': 'ru,en-US;q=0.7,en;q=0.3',
        Referer: `https://${domains[0]}/`,
        'User-Agent': UserAgents.GROUPLE_ARORA,
      },
      create: (ctx) => createGroupleParser(groupleConfig, ctx),
    };
  }
  if (libSocialConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: (ctx) => createLibSocialParser(libSocialConfig, ctx),
    };
  }
  if (chanConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      // These DLE-engine sites stall requests with no User-Agent for ~60s before answering
      // 504 — well past our 20s headers timeout — but respond immediately to a browser-like one.
      defaultHeaders: {
        'User-Agent': UserAgents.CHROME_DESKTOP,
        'Accept-Language': 'ru,en-US;q=0.7,en;q=0.3',
      },
      create: (ctx) => createChanParser(chanConfig, ctx),
    };
  }
  if (multpornConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: (ctx) => createMultpornParser(multpornConfig, ctx),
    };
  }
  if (senkuroConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: (ctx) => createSenkuroParser(senkuroConfig, ctx),
    };
  }
  const singleSourceFactory = SINGLE_SOURCE_FACTORIES[id];
  if (singleSourceFactory) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: singleSourceFactory,
    };
  }
  return {
    info,
    domains,
    cookieScope: cookieScopeFor(id),
    defaultHeaders: {},
    create: notImplemented(id, info),
  };
};

export const SOURCES: Record<SourceId, SourceDescriptor> = Object.fromEntries(
  SOURCE_IDS.map((id) => [id, buildDescriptor(id)]),
) as Record<SourceId, SourceDescriptor>;

export const listSources = (): RawSourceInfo[] => {
  return SOURCE_IDS.map((id) => SOURCES[id].info);
};

export type ParsersRegistry = {
  listSources(): RawSourceInfo[];
  get(sourceId: string): Parser;
  imageHeaders(sourceId: string, imageUrl: string): Record<string, string>;
  decodeImage(sourceId: string, bytes: Buffer, imageUrl: string): Promise<Buffer>;
  init(): Promise<void>;
  /**
   * Resolves once the init() kicked off at boot has settled (immediately if init() was never
   * called). Lets the host start listening right away and make only the calls that actually
   * touch a source wait for warmup — see parsers.provider.ts.
   */
  ready(): Promise<void>;
  close(): Promise<void>;
};

export type RegistryOptions = {
  credentials: Credentials;
  logger: Logger;
  timeouts?: Partial<Timeouts>;
};

/**
 * Parser instances are long-lived — one per known source, created eagerly here rather than
 * per-request (as the Kotlin sidecar did via `newParserInstance` on every HTTP call). That's
 * what makes state like Grouple's `cachedPagesServer` or Desu's tag cache worth having at all.
 */
export const createRegistry = (opts: RegistryOptions): ParsersRegistry => {
  const jars = new Map<string, CookieJar>();
  const parsers = new Map<string, Parser>();
  let initPromise: Promise<void> | null = null;

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
      createHttpClient: (extraJar) =>
        new HttpClientImpl({
          sourceId: id,
          jar: extraJar,
          defaultHeaders: descriptor.defaultHeaders,
          timeouts: opts.timeouts,
        }),
    };
    // isBroken authoritatively comes from SOURCE_CATALOG (descriptor.info, built in
    // buildDescriptor above) — not from whatever the individual engine's own `info` object
    // says. Every engine but SENKURO hardcodes `isBroken: false` in its own info literal
    // (copy-pasted boilerplate, not a per-source decision), which silently no-ops the catalog's
    // isBroken flag for every source on that engine. Overriding it here, once, in the one place
    // that already reads the catalog correctly, means a future engine can't reintroduce the
    // same bug by copying the same boilerplate.
    const parser = descriptor.create(ctx);
    parsers.set(id, { ...parser, info: { ...parser.info, isBroken: descriptor.info.isBroken } });
  }

  return {
    // Reads from the instantiated parsers, not the module-level `listSources` (which only knows
    // the static descriptor `info` built before any parser ran createXParser() — that copy still
    // carries the registry's placeholder `sortOrders: []` rather than each parser's real list).
    listSources() {
      return SOURCE_IDS.map((id) => parsers.get(id)!.info);
    },
    get(sourceId) {
      const parser = parsers.get(sourceId);
      if (!parser) throw new UnknownSourceError(sourceId);
      return parser;
    },
    imageHeaders(sourceId, imageUrl) {
      return parsers.get(sourceId)?.imageHeaders(imageUrl) ?? {};
    },
    async decodeImage(sourceId, bytes, imageUrl) {
      return (await parsers.get(sourceId)?.decodeImage?.(bytes, imageUrl)) ?? bytes;
    },
    init() {
      // Memoized so ready() can hand out the same promise and repeat init() calls are no-ops.
      initPromise ??= Promise.allSettled(
        [...parsers.values()].map(async (parser) => {
          try {
            await parser.init?.();
          } catch (err) {
            opts.logger.warn(
              `init() failed for ${parser.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }),
      ).then(() => undefined);
      return initPromise;
    },
    ready() {
      return initPromise ?? Promise.resolve();
    },
    async close() {
      await Promise.allSettled(
        [...parsers.values()].map((parser) => parser.close?.() ?? Promise.resolve()),
      );
    },
  };
};
