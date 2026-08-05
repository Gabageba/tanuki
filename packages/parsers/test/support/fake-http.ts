import { parseHtml } from '../../src/core/html/dom';
import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
  Interceptor,
} from '../../src/core/http/client';

export interface FixtureResponse {
  status: number;
  body: string;
  contentType?: string;
}

/**
 * `body` lets a rule disambiguate requests that share a URL (e.g. a single GraphQL endpoint
 * POSTed to with different queries) — existing matchers that only look at `url` still work
 * unchanged since the parameter is optional.
 */
type Matcher = (url: string, body?: string) => boolean;

/**
 * Minimal in-memory HttpClient for conformance tests — no network, no redirects, no cookies.
 * Rules are matched in registration order; the first match wins.
 */
export class FakeHttpClient implements HttpClient {
  private readonly rules: { test: Matcher; response: () => FixtureResponse }[] = [];

  /** Every request that reached this client, in order — for asserting on headers a Matcher
   *  can't see (e.g. Senkuro's catalog-selecting `app-id`). */
  readonly requests: { url: string; headers: Record<string, string>; body?: string }[] = [];

  register(test: Matcher, response: FixtureResponse | (() => FixtureResponse)): void {
    this.rules.push({ test, response: typeof response === 'function' ? response : () => response });
  }

  use(_interceptor: Interceptor): void {
    // Fixtures don't exercise auth/header interceptors — parsers under test here don't
    // register any that affect the assertions (Desu has none; Grouple's would need a real
    // cookie jar round-trip that fixture-based tests intentionally don't model).
  }

  private resolve(url: string, requestBody?: string): FixtureResponse {
    const rule = this.rules.find((r) => r.test(url, requestBody));
    if (!rule) throw new Error(`FakeHttpClient: no fixture registered for ${url}`);
    return rule.response();
  }

  async request(req: Partial<HttpRequest> & { url: string }): Promise<HttpResponse> {
    const requestBody = typeof req.body === 'string' ? req.body : req.body?.toString();
    this.requests.push({ url: req.url, headers: req.headers ?? {}, body: requestBody });
    const { status, body, contentType } = this.resolve(req.url, requestBody);
    const bytes = Buffer.from(body, 'utf-8');
    return {
      status,
      headers: { 'content-type': contentType ?? 'text/html; charset=utf-8' },
      url: req.url,
      bytes,
      text: () => body,
      json: <T>() => JSON.parse(body) as T,
    };
  }

  async get(url: string): Promise<HttpResponse> {
    const res = await this.request({ url, method: 'GET', headers: {} });
    if (res.status >= 400)
      throw new Error(`FakeHttpClient: fixture status ${res.status} for ${url}`);
    return res;
  }

  async getHtml(url: string) {
    const res = await this.get(url);
    return parseHtml(res.text(), res.url);
  }

  async getJson<T>(url: string): Promise<T> {
    const res = await this.get(url);
    return res.json<T>();
  }

  async postForm(url: string): Promise<HttpResponse> {
    return this.get(url);
  }

  async head(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {}
}
