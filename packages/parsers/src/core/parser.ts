import type { CookieJar } from 'tough-cookie';
import type { ResolvedSearchFilters, SearchFilterCriteria } from '@tanuki/contracts';
import type {
  RawTitle,
  RawChapter,
  RawPage,
  RawSourceInfo,
  RawFilterGroup,
  RawHomeSection,
  RawHomeSectionPage,
  RawHomeSectionParams,
  RawBookmarkFolder,
} from '../types';
import type { ListParams, FilterSelection } from './paging';
import type { HttpClient } from './http/client';

export type { ListParams, FilterSelection };

export type Logger = {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
};

export type GroupleCredentials = {
  username: string;
  password: string;
};

export type LibSocialCredentials = {
  /**
   * Directory holding one JSON token file per network member (`<sourceId>.json`), written by
   * `pnpm --filter @tanuki/parsers login:libsocial <sourceId>` (see sources/libsocial/auth.ts).
   * OAuth login itself is reCAPTCHA-gated and can only be driven by a human via that script, so
   * unlike Grouple this isn't a username/password pair the engine can use to log itself in —
   * it only ever reads and rotates the file afterwards.
   */
  tokenStoreDir: string;
};

export type Credentials = {
  grouple?: GroupleCredentials;
  /** AllHentai's qawa.org SSO gateway is a separate account system from the main network. */
  allhentai?: GroupleCredentials;
  libsocial?: LibSocialCredentials;
  /** Service account for Nude-Moon's own login — only its title search needs it. */
  nudemoon?: GroupleCredentials;
};

export type ParserContext = {
  readonly http: HttpClient;
  readonly domain: string;
  readonly jar: CookieJar;
  readonly logger: Logger;
  readonly credentials: Credentials;
  /**
   * Builds an extra HttpClient bound to a caller-supplied jar instead of `jar` — for a source
   * that needs a second, isolated cookie session alongside its main one (e.g. one endpoint
   * behaves differently under a cookie that would corrupt another endpoint's response if it sat
   * on the shared jar). Optional: only sources that need it call it, so most `ParserContext`
   * builders (including per-parser conformance tests) can leave it out.
   */
  createHttpClient?(jar: CookieJar): HttpClient;
};

export type Parser = {
  readonly id: string;
  /** Metadata without network or lazy init; calendar periods may be computed on access. */
  readonly info: RawSourceInfo;
  /** chapters MUST be null on every returned item. */
  getList(params: ListParams): Promise<RawTitle[]>;
  /** chapters MUST be populated (possibly []). */
  getDetails(url: string): Promise<RawTitle>;
  /** RawPage.url MUST be absolute and pre-resolved. */
  getPages(chapterUrl: string): Promise<RawPage[]>;
  /** All filter groups and their options as currently listed on the source. Omit entirely on
   *  sources that don't expose a catalog filter UI — RawSourceInfo.isFiltersSupported mirrors
   *  whether this is present. */
  getFilters?(): Promise<RawFilterGroup[]>;
  /** Blocks of the source's own home page («Горячие новинки», «В тренде») — exactly the ones in
   *  RawSourceInfo.homeSections, in that order. A block the page no longer has comes back with
   *  empty `items` rather than an error. Omit on sources without a home page worth showing. */
  getHome?(): Promise<RawHomeSection[]>;
  /** One portion of a single home block, for blocks the site serves in pages (or by variant).
   *  null — this block isn't fetched on its own: the caller takes it from getHome() as a single
   *  portion. Omit on sources where every block is a fixed list on the home page. */
  getHomeSection?(id: string, params: RawHomeSectionParams): Promise<RawHomeSectionPage | null>;
  /** Search criteria (title type / state) as this source's own filters — no network. Omit on
   *  sources whose search doesn't combine with filters (RawSourceInfo.isSearchWithFiltersSupported
   *  false); the caller then treats every criterion as unapplied. */
  resolveSearchFilters?(criteria: SearchFilterCriteria): ResolvedSearchFilters;
  /** Закладки текущего аккаунта (`currentSourceAccount`) по папкам сайта; без аккаунта — ошибка
   *  входа. Omit on sources without bookmarks import — RawSourceInfo.isBookmarksImportSupported
   *  mirrors whether this is present. */
  getBookmarks?(): Promise<RawBookmarkFolder[]>;
  /** Headers the source expects when hotlinking its images — consumed by img-proxy. */
  imageHeaders(imageUrl: string): Record<string, string>;
  /**
   * Post-fetch transform for sources that serve obfuscated/encrypted image bytes (e.g.
   * INKSTORY's client-side XOR scheme) — consumed by img-proxy after the raw body is fetched
   * and decompressed. Sources whose images are plain files omit this entirely.
   */
  decodeImage?(bytes: Buffer, imageUrl: string): Promise<Buffer>;
  /** Optional one-time warmup (e.g. Grouple SSO login). Failure must be non-fatal. */
  init?(): Promise<void>;
  close?(): Promise<void>;
};

export type {
  RawTitle,
  RawChapter,
  RawPage,
  RawSourceInfo,
  RawFilterGroup,
  RawHomeSection,
  RawHomeSectionPage,
  RawHomeSectionParams,
  RawBookmarkFolder,
};
