import type { CookieJar } from 'tough-cookie';
import type { RawManga, RawChapter, RawPage, RawSourceInfo } from '../types';
import type { ListParams } from './paging';
import type { HttpClient } from './http/client';

export type { ListParams };

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface GroupleCredentials {
  username: string;
  password: string;
}

export interface Credentials {
  grouple?: GroupleCredentials;
}

export interface ParserContext {
  readonly http: HttpClient;
  readonly domain: string;
  readonly jar: CookieJar;
  readonly logger: Logger;
  readonly credentials: Credentials;
}

export interface Parser {
  readonly id: string;
  /** Static metadata — no network, no lazy init. Mirrors the registry descriptor's `info`. */
  readonly info: RawSourceInfo;
  /** chapters MUST be null on every returned item. */
  getList(params: ListParams): Promise<RawManga[]>;
  /** chapters MUST be populated (possibly []). */
  getDetails(url: string): Promise<RawManga>;
  /** RawPage.url MUST be absolute and pre-resolved. */
  getPages(chapterUrl: string): Promise<RawPage[]>;
  /** Headers the source expects when hotlinking its images — consumed by img-proxy. */
  imageHeaders(imageUrl: string): Record<string, string>;
  /** Optional one-time warmup (e.g. Grouple SSO login). Failure must be non-fatal. */
  init?(): Promise<void>;
  close?(): Promise<void>;
}

export type { RawManga, RawChapter, RawPage, RawSourceInfo };
