import { CookieJar } from 'tough-cookie';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { Parser, ParserContext, Credentials, GroupleCredentials, Logger } from './core/parser';
import type { LibSocialTokenState, TokenStore } from './core/source-accounts';
import type { RawSourceInfo } from './types';
import { HttpClientImpl, type Timeouts } from './core/http/client';
import { UserAgents } from './core/http/user-agents';
import { jarFor } from './core/http/cookies';
import { NotImplementedError, SourceTokenExpiredError, UnknownSourceError } from './errors';
import { SOURCE_LOCALE } from '@tanuki/contracts';
import { SOURCE_CATALOG, SOURCE_ID, SOURCE_IDS, type SourceId } from './sources/catalog';
export { SOURCE_ID, SOURCE_IDS, type SourceId } from './sources/catalog';
import { GROUPLE_CONFIGS } from './sources/grouple/config';
import { createGroupleParser } from './sources/grouple/engine';
import { authenticateAllHentai, authenticateGrouple } from './sources/grouple/auth';
import { fetchLibSocialAccountName } from './sources/libsocial/auth';
import {
  confirmLibSocialLogin,
  loginLibSocialWithPassword,
  type LibSocialLoginResult,
  type LibSocialPendingLogin,
} from './sources/libsocial/login';
import { createDesuParser } from './sources/desu';
import { loginDesu } from './sources/desu/auth';
import { LIBSOCIAL_API_HOST, LIBSOCIAL_CONFIGS } from './sources/libsocial/config';
import { createLibSocialParser } from './sources/libsocial/engine';
import { CHAN_CONFIGS } from './sources/chan/config';
import { createChanParser } from './sources/chan/engine';
import { createRemangaParser } from './sources/remanga';
import {
  createRemangaSessionJar,
  fetchRemangaViewer,
  parseRemangaSessionValue,
  loginRemanga,
  saveRemangaSessionToken,
} from './sources/remanga/auth';
import { createMangaBuffParser } from './sources/mangabuff';
import { loginMangaBuff } from './sources/mangabuff/auth';
import { INUKO_CONFIGS } from './sources/inuko/config';
import { createInukoParser } from './sources/inuko/engine';
import {
  createInukoSessionJar,
  fetchInukoViewer,
  parseInukoSessionValue,
} from './sources/inuko/auth';
import { createComxParser } from './sources/comx';
import { createTomiloLibParser } from './sources/tomilolib';
import { loginTomiloLib, saveTomiloLibTokens } from './sources/tomilolib/auth';
import { createWaMangaParser } from './sources/wamanga';
import { loginWaManga, saveWaMangaTokens } from './sources/wamanga/auth';
import { createNudeMoonParser } from './sources/nudemoon';
import { loginNudeMoon } from './sources/nudemoon/auth';
import { createAComicsParser } from './sources/acomics';
import { SENKURO_CONFIGS } from './sources/senkuro/config';
import { createSenkuroParser } from './sources/senkuro/engine';
import {
  createSenkuroSessionJar,
  fetchSenkuroViewer,
  parseSenkuroSessionValue,
} from './sources/senkuro/auth';
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
  SOURCE_ID.PUREMANGA,
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
  const inukoConfig = INUKO_CONFIGS.find((c) => c.id === id);

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
    isSearchWithFiltersSupported: false,
    homeSections: [],
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
      // api.cdnlibs.org's ddos-guard rejects any request with no Referer at all with a bare 403
      // ("Client does not have access rights") — confirmed live, the value itself isn't checked,
      // only its presence, but the site's own domain is what a real browser would send.
      defaultHeaders: { Referer: `https://${domains[0]}/` },
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
  if (inukoConfig) {
    return {
      info,
      domains,
      cookieScope: cookieScopeFor(id),
      defaultHeaders: {},
      create: (ctx) => createInukoParser(inukoConfig, ctx),
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

/** Семейства, в которые сервер входит сам — логином и паролем пользователя. */
export type PasswordAuthFamily =
  | typeof SOURCE_AUTH_FAMILY.GROUPLE
  | typeof SOURCE_AUTH_FAMILY.ALLHENTAI
  | typeof SOURCE_AUTH_FAMILY.NUDEMOON
  | typeof SOURCE_AUTH_FAMILY.DESU
  | typeof SOURCE_AUTH_FAMILY.MANGABUFF
  | typeof SOURCE_AUTH_FAMILY.REMANGA
  | typeof SOURCE_AUTH_FAMILY.TOMILOLIB
  | typeof SOURCE_AUTH_FAMILY.WAMANGA;

/**
 * Семейства с переносом сессии: человек входит в своём браузере и переносит cookie,
 * сервер её только проверяет (Inuko — капча, Senkuro/Senkognito — SSO,
 * ReManga — запасной путь для соцсетей и 2FA).
 */
export type SessionAuthFamily =
  | typeof SOURCE_AUTH_FAMILY.INUKO
  | typeof SOURCE_AUTH_FAMILY.REMANGA
  | typeof SOURCE_AUTH_FAMILY.SENKURO;

/** Принятая сессия: jar для аккаунта и имя, под которым человек вошёл на сайт. */
export type LinkedSession = { jar: CookieJar; login: string };

export type ParsersRegistry = {
  listSources(): RawSourceInfo[];
  get(sourceId: string): Parser;
  imageHeaders(sourceId: string, imageUrl: string): Record<string, string>;
  decodeImage(sourceId: string, bytes: Buffer, imageUrl: string): Promise<Buffer>;
  init(): Promise<void>;
  /**
   * Входит в Grouple, AllHentai, Nude-Moon, Desu, MangaBuff, ReManga или TomiloLib под учёткой пользователя, в свежий
   * jar — общий и чужие сессии не задеваются. Возвращает jar с сессией или null, если вход не удался.
   */
  loginAccount(
    family: PasswordAuthFamily,
    credentials: GroupleCredentials,
  ): Promise<CookieJar | null>;
  /**
   * Проверяет перенесённую из браузера cookie сессии: открывает сайты семейства с ней в свежем
   * jar и смотрит, кого сайт узнал. У ReManga cookie содержит Bearer-токен API. У Inuko cookie host-only, а с какого сайта сети её сняли, неизвестно,
   * — принимается первый домен, на котором сайт узнал человека, и jar хранит cookie на нём.
   * null — значение не похоже на сессию или ни один сайт не узнал человека.
   */
  linkSession(family: SessionAuthFamily, value: string): Promise<LinkedSession | null>;
  /**
   * Проверяет токен LibSocial для источника и возвращает имя аккаунта (null — токен не
   * принят). Истёкший access_token по пути обменивается — новый пишется в store.
   */
  fetchLibSocialAccountName(sourceId: string, store: TokenStore): Promise<string | null>;
  /**
   * Сайты LibSocial, в которые умеем входить. Учётка на них общая, а токен каждый выдаёт свой —
   * аккаунт пользователя получает токен на каждом.
   */
  libSocialLoginSourceIds(): string[];
  /**
   * Входит в LibSocial логином и паролем (форма сайта с ALTCHA, затем OAuth-код) и возвращает
   * свою пару токенов, начатый вход, если сайт прислал код на почту, или null — сайт не принял
   * логин или пароль.
   */
  loginLibSocial(sourceId: string, credentials: GroupleCredentials): Promise<LibSocialLoginResult>;
  /** Завершает вход в LibSocial кодом из письма; null — сайт не принял код. */
  confirmLibSocialLogin(
    sourceId: string,
    pending: LibSocialPendingLogin,
    code: string,
  ): Promise<LibSocialTokenState | null>;
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
    const authFamily = SOURCE_CATALOG[id].authFamily;
    const http = new HttpClientImpl({
      sourceId: id,
      jar,
      authFamily,
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
    parsers.set(id, {
      ...parser,
      info: {
        ...parser.info,
        isBroken: descriptor.info.isBroken,
        // Same reasoning: derived from the parser itself, so no engine has to remember the flag.
        isBookmarksImportSupported: parser.getBookmarks !== undefined,
      },
    });
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
    async loginAccount(family, credentials) {
      if (family === SOURCE_AUTH_FAMILY.TOMILOLIB) {
        const sourceId = SOURCE_ID.TOMILOLIB;
        const domain = SOURCES[sourceId].domains[0];
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const tokens = await loginTomiloLib(http, domain, credentials);
          if (!tokens) return null;
          await saveTomiloLibTokens(jar, domain, tokens);
          return jar;
        } finally {
          await http.close();
        }
      }
      if (family === SOURCE_AUTH_FAMILY.WAMANGA) {
        const sourceId = SOURCE_ID.WAMANGA;
        const domain = SOURCES[sourceId].domains[0];
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const tokens = await loginWaManga(http, domain, credentials);
          if (!tokens) return null;
          await saveWaMangaTokens(jar, domain, tokens);
          return jar;
        } finally {
          await http.close();
        }
      }
      if (family === SOURCE_AUTH_FAMILY.REMANGA) {
        const sourceId = SOURCE_ID.REMANGA;
        const domain = SOURCES[sourceId].domains[0];
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const token = await loginRemanga(http, domain, credentials);
          if (!token) return null;
          await saveRemangaSessionToken(jar, domain, token);
          return jar;
        } finally {
          await http.close();
        }
      }
      if (family === SOURCE_AUTH_FAMILY.NUDEMOON) {
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId: SOURCE_ID.NUDEMOON,
          jar,
          defaultHeaders: SOURCES[SOURCE_ID.NUDEMOON].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const domain = SOURCES[SOURCE_ID.NUDEMOON].domains[0];
          return (await loginNudeMoon(http, jar, domain, credentials, opts.logger)) ? jar : null;
        } finally {
          await http.close();
        }
      }

      if (family === SOURCE_AUTH_FAMILY.DESU) {
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId: SOURCE_ID.DESUME,
          jar,
          defaultHeaders: SOURCES[SOURCE_ID.DESUME].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const domain = SOURCES[SOURCE_ID.DESUME].domains[0];
          return (await loginDesu(http, domain, credentials, opts.logger)) !== null ? jar : null;
        } finally {
          await http.close();
        }
      }

      if (family === SOURCE_AUTH_FAMILY.MANGABUFF) {
        const jar = new CookieJar();
        const http = new HttpClientImpl({
          sourceId: SOURCE_ID.MANGABUFF,
          jar,
          defaultHeaders: SOURCES[SOURCE_ID.MANGABUFF].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const domain = SOURCES[SOURCE_ID.MANGABUFF].domains[0];
          const userId = await loginMangaBuff(http, domain, credentials, opts.logger);
          return userId !== null ? jar : null;
        } finally {
          await http.close();
        }
      }

      const memberId =
        family === SOURCE_AUTH_FAMILY.ALLHENTAI ? SOURCE_ID.ALLHENTAI : SOURCE_ID.READMANGA_RU;
      const cfg = GROUPLE_CONFIGS.find((config) => config.id === memberId);
      if (!cfg) throw new UnknownSourceError(memberId);

      const jar = new CookieJar();
      const http = new HttpClientImpl({
        sourceId: memberId,
        jar,
        defaultHeaders: SOURCES[memberId].defaultHeaders,
        timeouts: opts.timeouts,
      });
      try {
        const isLoggedIn =
          family === SOURCE_AUTH_FAMILY.ALLHENTAI
            ? await authenticateAllHentai(http, jar, cfg, credentials, opts.logger)
            : await authenticateGrouple(http, jar, credentials, opts.logger);
        return isLoggedIn ? jar : null;
      } finally {
        await http.close();
      }
    },
    async linkSession(family, value) {
      if (family === SOURCE_AUTH_FAMILY.SENKURO) {
        const token = parseSenkuroSessionValue(value);
        if (!token) return null;
        const cfg = SENKURO_CONFIGS.find(({ id }) => SOURCE_CATALOG[id].authFamily === family)!;
        const sourceId = cfg.id;
        const domain = SOURCES[sourceId].domains[0];
        const jar = await createSenkuroSessionJar(token);
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const viewer = await fetchSenkuroViewer(http, cfg, domain, token);
          return { jar, login: viewer.user!.name };
        } catch (error) {
          if (error instanceof SourceTokenExpiredError) return null;
          throw error;
        } finally {
          await http.close();
        }
      }
      if (family === SOURCE_AUTH_FAMILY.REMANGA) {
        const token = parseRemangaSessionValue(value);
        if (!token) return null;
        const sourceId = SOURCE_ID.REMANGA;
        const domain = SOURCES[sourceId].domains[0];
        const jar = await createRemangaSessionJar(domain, token);
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const viewer = await fetchRemangaViewer(http, domain, token);
          return { jar, login: viewer.username };
        } catch (error) {
          if (error instanceof SourceTokenExpiredError) return null;
          throw error;
        } finally {
          await http.close();
        }
      }
      const session = parseInukoSessionValue(value);
      if (!session) return null;
      const memberIds = SOURCE_IDS.filter((id) => SOURCE_CATALOG[id].authFamily === family);
      // Ошибка сети пробрасывается, только если не ответил ни один сайт: гость на доступном
      // сайте — это неподошедшая cookie, а не недоступный источник.
      let lastError: unknown = null;
      let isAnswered = false;
      for (const sourceId of memberIds) {
        const domain = SOURCES[sourceId].domains[0];
        const jar = await createInukoSessionJar(domain, session);
        const http = new HttpClientImpl({
          sourceId,
          jar,
          defaultHeaders: SOURCES[sourceId].defaultHeaders,
          timeouts: opts.timeouts,
        });
        try {
          const viewer = await fetchInukoViewer(http, domain);
          isAnswered = true;
          if (viewer) return { jar, login: viewer.username };
        } catch (err) {
          lastError = err;
          opts.logger.warn(
            `linkSession failed on ${domain}: ${err instanceof Error ? err.message : String(err)}`,
          );
        } finally {
          await http.close();
        }
      }
      if (!isAnswered && lastError) throw lastError;
      return null;
    },
    async fetchLibSocialAccountName(sourceId, store) {
      const cfg = LIBSOCIAL_CONFIGS.find((config) => config.id === sourceId);
      if (!cfg?.auth) throw new UnknownSourceError(sourceId);
      return fetchLibSocialAccountName(
        cfg.auth,
        cfg.siteId,
        store,
        sourceId,
        opts.logger,
        LIBSOCIAL_API_HOST,
      );
    },
    libSocialLoginSourceIds() {
      return LIBSOCIAL_CONFIGS.filter((config) => config.auth).map((config) => config.id);
    },
    async loginLibSocial(sourceId, credentials) {
      const cfg = LIBSOCIAL_CONFIGS.find((config) => config.id === sourceId);
      if (!cfg?.auth) throw new UnknownSourceError(sourceId);
      return loginLibSocialWithPassword(cfg.auth, cfg.siteId, credentials, sourceId);
    },
    async confirmLibSocialLogin(sourceId, pending, code) {
      const cfg = LIBSOCIAL_CONFIGS.find((config) => config.id === sourceId);
      if (!cfg?.auth) throw new UnknownSourceError(sourceId);
      return confirmLibSocialLogin(cfg.auth, cfg.siteId, pending, code, sourceId);
    },
    async close() {
      await Promise.allSettled(
        [...parsers.values()].map((parser) => parser.close?.() ?? Promise.resolve()),
      );
    },
  };
};
