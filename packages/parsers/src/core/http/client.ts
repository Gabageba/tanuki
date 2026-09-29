import { Agent, request as undiciRequest } from 'undici';
import type { CookieJar } from 'tough-cookie';
import type { SourceAuthFamily } from '@tanuki/contracts';
import { currentSourceAccount } from '../source-accounts';
import { decodeBytes, parseHtml, type Doc } from '../html/dom';
import { decompress } from './decompress';
import { classifyResponse } from './classify';
import { SourceUnavailableError } from '../../errors';

export type HttpMethod = 'GET' | 'POST' | 'HEAD';
export type HttpHeaders = Record<string, string | string[] | undefined>;

export type HttpRequest = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string | URLSearchParams;
  signal?: AbortSignal;
};

export type HttpResponse = {
  status: number;
  headers: HttpHeaders;
  /** Final URL after following redirects. */
  url: string;
  bytes: Buffer;
  text(): string;
  json<T>(): T;
};

export type Interceptor = (
  req: HttpRequest,
  next: (r: HttpRequest) => Promise<HttpResponse>,
) => Promise<HttpResponse>;

export type Timeouts = {
  connect: number;
  headers: number;
  body: number;
};

export const DEFAULT_TIMEOUTS: Timeouts = { connect: 20_000, headers: 20_000, body: 60_000 };

export type HttpClient = {
  use(interceptor: Interceptor): void;
  /** Raw request — does not throw on non-2xx, caller decides via classifyResponse if needed. */
  request(req: Partial<HttpRequest> & { url: string }): Promise<HttpResponse>;
  /** GET + throws SourceUnavailableError/NotFoundError/SourceBlockedError on non-2xx. */
  get(url: string, headers?: Record<string, string>): Promise<HttpResponse>;
  getHtml(url: string, headers?: Record<string, string>): Promise<Doc>;
  getJson<T>(url: string, headers?: Record<string, string>): Promise<T>;
  postForm(
    url: string,
    form: Record<string, string>,
    headers?: Record<string, string>,
  ): Promise<HttpResponse>;
  /** true if the target responds successfully and has a plausible non-empty body. */
  head(url: string, minContentLength?: number): Promise<boolean>;
  close(): Promise<void>;
};

const MAX_REDIRECTS = 10;

/**
 * A connect/TLS-handshake attempt (e.g. "Client network socket disconnected before secure TLS
 * connection was established") can fail transiently for reasons that have nothing to do with the
 * target being down — a dropped packet, a stale pooled socket the OS hadn't yet reported closed,
 * a mid-handshake reset. Nothing has been sent to the server yet at this point, so retrying is
 * safe; a request that still fails after these retries is treated as a real outage.
 */
const CONNECTION_RETRY_DELAYS_MS = [300, 900];

export type HttpClientOptions = {
  sourceId: string;
  jar: CookieJar;
  /**
   * Семейство аккаунта источника. Запрос от пользователя с аккаунтом этого семейства ходит
   * только со своим jar — общий (в нём сессия сервисной учётки) он не видит и не пополняет.
   */
  authFamily?: SourceAuthFamily | null;
  defaultHeaders: Record<string, string>;
  timeouts?: Partial<Timeouts>;
};

const normalizeHeaderValue = (value: string | string[] | undefined): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export class HttpClientImpl implements HttpClient {
  private readonly interceptors: Interceptor[] = [];
  private readonly agent: Agent;
  private readonly timeouts: Timeouts;

  constructor(private readonly opts: HttpClientOptions) {
    this.timeouts = { ...DEFAULT_TIMEOUTS, ...opts.timeouts };
    this.agent = new Agent({
      connectTimeout: this.timeouts.connect,
      headersTimeout: this.timeouts.headers,
      bodyTimeout: this.timeouts.body,
      connections: 6,
    });
  }

  use(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  async request(req: Partial<HttpRequest> & { url: string }): Promise<HttpResponse> {
    const full: HttpRequest = {
      method: req.method ?? 'GET',
      url: req.url,
      headers: { ...this.opts.defaultHeaders, ...req.headers },
      body: req.body,
      signal: req.signal,
    };
    const chain = this.interceptors.reduceRight<(r: HttpRequest) => Promise<HttpResponse>>(
      (next, interceptor) => (r) => interceptor(r, next),
      (r) => this.sendWithRedirects(r, 0),
    );
    return chain(full);
  }

  async get(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    const res = await this.request({ url, method: 'GET', headers });
    this.throwIfError(res);
    return res;
  }

  async getHtml(url: string, headers?: Record<string, string>): Promise<Doc> {
    const res = await this.get(url, headers);
    return parseHtml(res.text(), res.url);
  }

  async getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const res = await this.get(url, headers);
    return res.json<T>();
  }

  async postForm(
    url: string,
    form: Record<string, string>,
    headers?: Record<string, string>,
  ): Promise<HttpResponse> {
    const res = await this.request({
      url,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
      body: new URLSearchParams(form),
    });
    this.throwIfError(res);
    return res;
  }

  async head(url: string, minContentLength = 0): Promise<boolean> {
    try {
      const res = await this.request({ url, method: 'HEAD' });
      if (res.status < 200 || res.status >= 400) return false;
      const contentLength = Number(normalizeHeaderValue(res.headers['content-length']) ?? '0');
      return contentLength >= minContentLength;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.agent.close();
  }

  private throwIfError(res: HttpResponse): void {
    const bodySample = res.status >= 400 ? res.text().slice(0, 4096) : '';
    const error = classifyResponse(
      this.opts.sourceId,
      res.status,
      res.url,
      res.headers,
      bodySample,
    );
    if (error) throw error;
  }

  private async sendWithRedirects(req: HttpRequest, depth: number): Promise<HttpResponse> {
    if (depth > MAX_REDIRECTS) {
      throw new SourceUnavailableError(`Too many redirects: ${req.url}`, this.opts.sourceId);
    }

    // Cookies are attached here, not by the caller — every hop of a redirect chain gets its
    // own jar lookup, and every hop's Set-Cookie is saved before we follow the next one. An
    // interceptor-level Set-Cookie would only see the final response and lose antibot cookies
    // set on intermediate hops.
    const account = currentSourceAccount(this.opts.authFamily);
    const jar = account?.jar ?? this.opts.jar;
    const cookieHeader = await jar.getCookieString(req.url);
    const headers: Record<string, string> = { ...req.headers };
    if (cookieHeader) headers['cookie'] = cookieHeader;

    let response;
    for (let attempt = 0; ; attempt += 1) {
      try {
        response = await undiciRequest(req.url, {
          method: req.method,
          headers,
          body: req.body instanceof URLSearchParams ? req.body.toString() : req.body,
          dispatcher: this.agent,
          signal: req.signal,
        });
        break;
      } catch (err) {
        if (attempt >= CONNECTION_RETRY_DELAYS_MS.length) {
          throw new SourceUnavailableError(
            `Connection failed: ${err instanceof Error ? err.message : String(err)} (${req.url})`,
            this.opts.sourceId,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, CONNECTION_RETRY_DELAYS_MS[attempt]));
      }
    }

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      for (const cookieString of cookieStrings) {
        await jar.setCookie(cookieString, req.url).catch(() => undefined);
      }
      if (account?.jar) account.onChange?.();
    }

    const rawBytes = Buffer.from(await response.body.arrayBuffer());

    const location = response.headers['location'];
    if (response.statusCode >= 300 && response.statusCode < 400 && location) {
      const nextUrl = new URL(normalizeHeaderValue(location)!, req.url).toString();
      const keepMethod = response.statusCode === 307 || response.statusCode === 308;
      return this.sendWithRedirects(
        {
          ...req,
          url: nextUrl,
          method: keepMethod ? req.method : 'GET',
          body: keepMethod ? req.body : undefined,
        },
        depth + 1,
      );
    }

    const contentEncoding = normalizeHeaderValue(response.headers['content-encoding']);
    const bytes = decompress(rawBytes, contentEncoding);
    const contentType = normalizeHeaderValue(response.headers['content-type']);

    return {
      status: response.statusCode,
      headers: response.headers,
      url: req.url,
      bytes,
      text: () => decodeBytes(bytes, contentType),
      json: <T>() => JSON.parse(decodeBytes(bytes, contentType)) as T,
    };
  }
}
