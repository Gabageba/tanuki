import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Undici from 'undici';
import type { LibSocialAuthConfig } from '../src/sources/libsocial/config';
import {
  loginLibSocialWithPassword,
  solveAltcha,
  type LoginHttpRequest,
  type LoginHttpResponse,
} from '../src/sources/libsocial/login';

const tokenRequests = vi.hoisted(() => [] as Record<string, string>[]);

// Обмен кода на токены идёт напрямую через undici — подменяем только его.
vi.mock('undici', async (importOriginal) => ({
  ...(await importOriginal<typeof Undici>()),
  request: vi.fn(async (_url: string, init: { body: string }) => {
    tokenRequests.push(JSON.parse(init.body) as Record<string, string>);
    const body = JSON.stringify({
      token_type: 'Bearer',
      expires_in: 3600,
      access_token: 'access-1',
      refresh_token: 'refresh-1',
    });
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { arrayBuffer: async () => new TextEncoder().encode(body).buffer },
    };
  }),
}));

const ORIGIN = 'https://mangalib.me';
const AUTH: LibSocialAuthConfig = {
  authOrigin: ORIGIN,
  tokenUrl: 'https://api.cdnlibs.org/api/auth/oauth/token',
  clientId: '1',
  redirectUri: `${ORIGIN}/ru/front/auth/oauth/callback`,
};

const SALT = 'salt-abc:1790688386';
const NUMBER = 4242;
const CHALLENGE = {
  algorithm: 'SHA-256',
  challenge: createHash('sha256').update(`${SALT}${NUMBER}`).digest('hex'),
  salt: SALT,
  signature: 'sig',
  maxnumber: 100_000,
};

const LOGIN_PAGE = `
  <form action="${ORIGIN}/auth/login" method="post">
    <input type="hidden" name="_token" value="csrf-1" autocomplete="off">
    <input class="form-input__field" name="login" placeholder="Email или никнейм" value="" required>
    <input class="form-input__field" type="password" name="password" value="" required>
    <altcha-widget challengeurl="${ORIGIN}/altcha/challenge" name="altcha"></altcha-widget>
    <button type="submit">Войти</button>
  </form>`;

const CONSENT_PAGE = `
  <form method="post" action="${ORIGIN}/auth/oauth/authorize">
    <input type="hidden" name="_token" value="csrf-2">
    <input type="hidden" name="state" value="">
    <input type="hidden" name="client_id" value="1">
    <input type="hidden" name="auth_token" value="consent-token">
    <button type="submit">Продолжить</button>
  </form>
  <form method="post" action="${ORIGIN}/auth/oauth/authorize">
    <input type="hidden" name="_method" value="DELETE">
    <input type="hidden" name="auth_token" value="consent-token">
    <button type="submit">Отмена</button>
  </form>`;

type Site = { password: string; askConsent: boolean };

/** Сайт LibSocial в миниатюре: authorize → вход с ALTCHA → согласие → callback с кодом. */
const fakeSite = ({ password, askConsent }: Site) => {
  const requests: LoginHttpRequest[] = [];
  let state = '';
  let isLoggedIn = false;
  const redirect = (location: string, setCookie: string[] = []): LoginHttpResponse => ({
    status: 302,
    location,
    setCookie,
    body: '',
  });
  const page = (body: string): LoginHttpResponse => ({
    status: 200,
    location: null,
    setCookie: [],
    body,
  });
  const callback = () => redirect(`${AUTH.redirectUri}?code=code-1&state=${state}`);

  const http = async (req: LoginHttpRequest): Promise<LoginHttpResponse> => {
    requests.push(req);
    const url = new URL(req.url);
    if (url.pathname === '/auth/oauth/authorize' && req.method === 'GET') {
      state = url.searchParams.get('state') ?? state;
      if (!isLoggedIn) return redirect('/auth/login', ['mangalib_session=s1; Path=/; Secure']);
      return askConsent ? page(CONSENT_PAGE) : callback();
    }
    if (url.pathname === '/auth/oauth/authorize' && req.method === 'POST') return callback();
    if (url.pathname === '/auth/login' && req.method === 'GET') return page(LOGIN_PAGE);
    if (url.pathname === '/altcha/challenge') return page(JSON.stringify(CHALLENGE));
    if (url.pathname === '/auth/login' && req.method === 'POST') {
      const form = new URLSearchParams(req.body);
      const altcha = JSON.parse(Buffer.from(form.get('altcha') ?? '', 'base64').toString()) as {
        number: number;
      };
      if (altcha.number !== NUMBER || form.get('_token') !== 'csrf-1') return page('bad request');
      if (form.get('password') !== password) return redirect('/auth/login');
      isLoggedIn = true;
      return redirect(`/auth/oauth/authorize?state=${state}`);
    }
    throw new Error(`Неожиданный запрос ${req.method} ${req.url}`);
  };
  return { http, requests };
};

const CREDENTIALS = { username: 'reader', password: 'secret' };

describe('solveAltcha', () => {
  it('находит число и собирает payload виджета', async () => {
    const payload = await solveAltcha(CHALLENGE);
    expect(JSON.parse(Buffer.from(payload ?? '', 'base64').toString())).toEqual({
      algorithm: 'SHA-256',
      challenge: CHALLENGE.challenge,
      number: NUMBER,
      salt: SALT,
      signature: 'sig',
    });
  });

  it('возвращает null, если числа нет до maxnumber', async () => {
    expect(await solveAltcha({ ...CHALLENGE, maxnumber: NUMBER - 1 })).toBeNull();
  });
});

describe('loginLibSocialWithPassword', () => {
  beforeEach(() => {
    tokenRequests.length = 0;
  });

  it('входит, подтверждает доступ и обменивает код на свою пару токенов', async () => {
    const site = fakeSite({ password: 'secret', askConsent: true });
    const token = await loginLibSocialWithPassword(AUTH, 1, CREDENTIALS, 'mangalib', site.http);

    expect(token).toMatchObject({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(tokenRequests).toEqual([
      expect.objectContaining({ grant_type: 'authorization_code', code: 'code-1' }),
    ]);

    const loginPost = site.requests.find(
      (req) => req.method === 'POST' && req.url.endsWith('/auth/login'),
    );
    const form = new URLSearchParams(loginPost?.body);
    expect(form.get('login')).toBe('reader');
    expect(form.get('password')).toBe('secret');
    expect(loginPost?.headers.cookie).toContain('mangalib_session=s1');

    const consentPost = site.requests.find(
      (req) => req.method === 'POST' && req.url.endsWith('/auth/oauth/authorize'),
    );
    expect(new URLSearchParams(consentPost?.body).get('_method')).toBeNull();
    // Callback сайта не открывается — его JS сжёг бы код.
    expect(site.requests.some((req) => req.url.startsWith(AUTH.redirectUri))).toBe(false);
  });

  it('обходится без страницы согласия, если сайт сразу отдаёт код', async () => {
    const site = fakeSite({ password: 'secret', askConsent: false });
    const token = await loginLibSocialWithPassword(AUTH, 1, CREDENTIALS, 'mangalib', site.http);
    expect(token?.refreshToken).toBe('refresh-1');
  });

  it('возвращает null, когда сайт не принял пароль', async () => {
    const site = fakeSite({ password: 'other', askConsent: true });
    const token = await loginLibSocialWithPassword(AUTH, 1, CREDENTIALS, 'mangalib', site.http);
    expect(token).toBeNull();
    expect(tokenRequests).toHaveLength(0);
  });
});
