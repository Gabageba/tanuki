import { describe, expect, it, vi } from 'vitest';
import { CookieJar } from 'tough-cookie';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import {
  ParseError,
  SourceLoginRequiresSessionError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import {
  createRemangaSessionJar,
  fetchRemangaSessionJson,
  getRemangaSessionToken,
  loginRemanga,
} from '../src/sources/remanga/auth';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'remanga.example';
const API = `https://api.${DOMAIN}`;
const TOKEN = 'new-remanga-account-session-token';
const OLD_TOKEN = 'expired-remanga-account-session-token';
const CREDENTIALS = { username: 'reader@example.com', password: 'test-password' };
const VIEWER = { id: 42, username: 'reader' };
const PATH = '/api/v2/users/current/';
const makeContext = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const registerLogin = (http: FakeHttpClient, status: number, body: unknown) =>
  http.register((url) => url === `${API}/api/users/login/`, {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

// Запрос и content.access_token/two_factor_auth сверены с публичной формой ReManga.
describe('ReManga password login', () => {
  it('sends the login/email and password as user/password and reads the session token', async () => {
    const http = new FakeHttpClient();
    registerLogin(http, 200, { content: { access_token: TOKEN, username: 'reader', id: 42 } });
    expect(await loginRemanga(http, DOMAIN, CREDENTIALS)).toBe(TOKEN);
    expect(JSON.parse(http.requests[0]!.body!)).toEqual({
      user: CREDENTIALS.username,
      password: CREDENTIALS.password,
    });
    expect(http.requests[0]!.headers['content-type']).toBe('application/json');
  });
  it.each([400, 401])('returns a rejected login for HTTP %s', async (status) => {
    const http = new FakeHttpClient();
    registerLogin(http, status, { msg: 'Введен неверный логин/почта или пароль.' });
    expect(await loginRemanga(http, DOMAIN, CREDENTIALS)).toBeNull();
  });
  it('distinguishes a required second factor from rejected credentials', async () => {
    const http = new FakeHttpClient();
    registerLogin(http, 200, {
      content: { two_factor_auth: true, methods: [{ type: 'email', name: 'Почта' }] },
    });
    await expect(loginRemanga(http, DOMAIN, CREDENTIALS)).rejects.toBeInstanceOf(
      SourceLoginRequiresSessionError,
    );
  });
  it('does not report site downtime as a bad password', async () => {
    const http = new FakeHttpClient();
    registerLogin(http, 503, {});
    await expect(loginRemanga(http, DOMAIN, CREDENTIALS)).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });
  it('rejects a success response without the token', async () => {
    const http = new FakeHttpClient();
    registerLogin(http, 200, { content: {} });
    await expect(loginRemanga(http, DOMAIN, CREDENTIALS)).rejects.toBeInstanceOf(ParseError);
  });
});

describe('ReManga remembered password', () => {
  const registerViewer = (http: FakeHttpClient) =>
    http.register(
      (url) => url === `${API}${PATH}`,
      () => {
        const token = http.requests.at(-1)?.headers.Authorization;
        return {
          status: token === `Bearer ${TOKEN}` ? 200 : 401,
          body: JSON.stringify(VIEWER),
          contentType: 'application/json',
        };
      },
    );
  it('renews an expired session, persists its token and retries with the new token', async () => {
    const http = new FakeHttpClient();
    registerViewer(http);
    registerLogin(http, 200, { content: { access_token: TOKEN } });
    const jar = await createRemangaSessionJar(DOMAIN, OLD_TOKEN);
    const onChange = vi.fn();
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar, credentials: CREDENTIALS, onChange } },
      async () => {
        expect(await fetchRemangaSessionJson(makeContext(http), PATH)).toEqual(VIEWER);
      },
    );
    expect(await getRemangaSessionToken(jar, DOMAIN)).toBe(TOKEN);
    expect(onChange).toHaveBeenCalledOnce();
    expect(http.requests).toHaveLength(3);
  });
  it('does not attempt a password login when the password was not saved', async () => {
    const http = new FakeHttpClient();
    registerViewer(http);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar: await createRemangaSessionJar(DOMAIN, OLD_TOKEN) } },
      async () => {
        await expect(fetchRemangaSessionJson(makeContext(http), PATH)).rejects.toBeInstanceOf(
          SourceTokenExpiredError,
        );
      },
    );
    expect(http.requests).toHaveLength(1);
  });
  it('shares one relogin between concurrent requests of the same account', async () => {
    const http = new FakeHttpClient();
    registerViewer(http);
    registerLogin(http, 200, { content: { access_token: TOKEN } });
    const jar = await createRemangaSessionJar(DOMAIN, OLD_TOKEN);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar, credentials: CREDENTIALS } },
      async () => {
        const results = await Promise.all([
          fetchRemangaSessionJson(makeContext(http), PATH),
          fetchRemangaSessionJson(makeContext(http), PATH),
        ]);
        expect(results).toEqual([VIEWER, VIEWER]);
      },
    );
    expect(http.requests.filter(({ url }) => url.endsWith('/login/'))).toHaveLength(1);
  });
  it('does not loop when a saved password is rejected', async () => {
    const http = new FakeHttpClient();
    registerViewer(http);
    registerLogin(http, 400, {});
    const jar = await createRemangaSessionJar(DOMAIN, OLD_TOKEN);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar, credentials: CREDENTIALS } },
      async () => {
        await expect(fetchRemangaSessionJson(makeContext(http), PATH)).rejects.toBeInstanceOf(
          SourceTokenExpiredError,
        );
      },
    );
    expect(http.requests).toHaveLength(2);
    expect(await getRemangaSessionToken(jar, DOMAIN)).toBe(OLD_TOKEN);
  });
});
