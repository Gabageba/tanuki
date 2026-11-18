import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CookieJar } from 'tough-cookie';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import {
  SourceAuthRequiredError,
  SourceSessionStorageError,
  SourceTokenExpiredError,
} from '../src/errors';
import { createRemangaParser } from '../src/sources/remanga';
import type { RemangaServiceSession } from '../src/sources/remanga/models';
import { upgradeRemangaServiceSession } from '../src/sources/remanga/service-auth';
import {
  readRemangaServiceSession,
  writeRemangaServiceSession,
} from '../src/sources/remanga/service-session';
import { FakeHttpClient } from './support/fake-http';

const DIRS: string[] = [];
const DOMAIN = 'remanga.example';
const SITE = `https://${DOMAIN}/`;
const API = `https://api.${DOMAIN}`;
const CHAPTER_PATH = '/api/v2/titles/chapters/42/';
const PROFILE_PATH = '/api/v2/users/current/';
const TOKEN = 'valid-remanga-browser-session-token';
const EXPIRED = {
  token: 'expired-remanga-access-token',
  refreshToken: 'original-remanga-refresh-token',
};
const ROTATED = { token: TOKEN, refreshToken: 'rotated-remanga-refresh-token' };

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const makeSessionPath = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tanuki-remanga-'));
  DIRS.push(dir);
  return join(dir, 'remanga.json');
};

const makeParser = async (
  session: RemangaServiceSession,
  chapterToken: string | null = TOKEN,
  profileToken: string | null = TOKEN,
) => {
  const path = await makeSessionPath();
  await writeRemangaServiceSession(path, session);
  const http = new FakeHttpClient();
  http.register(
    (url) => url === `${API}${CHAPTER_PATH}`,
    () => ({
      status: http.requests.at(-1)?.headers.Authorization === `Bearer ${chapterToken}` ? 200 : 401,
      body: JSON.stringify({ pages: [{ link: `https://cdn.${DOMAIN}/page.jpg` }] }),
      contentType: 'application/json',
    }),
  );
  http.register(
    (url) => url === `${API}${PROFILE_PATH}`,
    () => ({
      status: http.requests.at(-1)?.headers.Authorization === `Bearer ${profileToken}` ? 200 : 401,
      body: JSON.stringify({ id: 42, username: 'reader' }),
      contentType: 'application/json',
    }),
  );
  const jar = new CookieJar();
  const warn = vi.fn();
  const parser = createRemangaParser({
    http,
    domain: DOMAIN,
    jar,
    credentials: { remanga: { sessionFile: path } },
    logger: { info: () => {}, warn, error: () => {} },
  });
  await parser.init?.();
  return { path, http, warn, jar, getPages: (path = CHAPTER_PATH) => parser.getPages(path) };
};

const tokenPairResponse = () =>
  Response.json({
    access_token: ROTATED.token,
    refresh_token: ROTATED.refreshToken,
    token_type: 'Bearer',
    expires_in: 3600,
  });

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(DIRS.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('ReManga configured service session', () => {
  it('exchanges the browser Bearer for a token pair without browser cookies', async () => {
    const fetch = vi.fn(async () => tokenPairResponse());
    vi.stubGlobal('fetch', fetch);
    await expect(upgradeRemangaServiceSession(DOMAIN, TOKEN)).resolves.toEqual(ROTATED);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${API}/api/v2/users/token/upgrade/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: '{}',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    });
  });

  it('uses the service Bearer after a background 401 and keeps it out of the guest request and jar', async () => {
    const { getPages, http, jar } = await makeParser(ROTATED);
    await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.REMANGA]: {} }, async () => {
      await expect(getPages()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    });
    await expect(getPages()).resolves.toHaveLength(1);
    expect(http.requests.map(({ headers }) => headers.Authorization)).toEqual([
      undefined,
      undefined,
      `Bearer ${TOKEN}`,
    ]);
    expect(await jar.getCookies(SITE)).toEqual([]);
  });

  it('shares one refresh across parallel 401s and retries each request once with the persisted pair', async () => {
    const { path, http, getPages } = await makeParser(EXPIRED);
    const refreshResponse = createDeferred<Response>();
    const fetch = vi.fn(() => refreshResponse.promise);
    vi.stubGlobal('fetch', fetch);
    const requests = Promise.all([getPages(), getPages(), getPages()]);
    await vi.waitFor(() => {
      expect(http.requests).toHaveLength(7);
      expect(fetch).toHaveBeenCalledExactlyOnceWith(`${API}/api/v2/users/token/refresh/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: EXPIRED.refreshToken }),
        redirect: 'error',
        signal: expect.any(AbortSignal),
      });
    });
    expect(await readRemangaServiceSession(path)).toEqual({ token: EXPIRED.token });
    refreshResponse.resolve(tokenPairResponse());
    await expect(requests).resolves.toEqual([
      expect.any(Array),
      expect.any(Array),
      expect.any(Array),
    ]);
    expect(http.requests).toHaveLength(11);
    expect(
      http.requests
        .filter(({ url }) => url === `${API}${PROFILE_PATH}`)
        .map(({ headers }) => headers.Authorization),
    ).toEqual([`Bearer ${EXPIRED.token}`, `Bearer ${ROTATED.token}`]);
    expect(http.requests.slice(-3).map(({ headers }) => headers.Authorization)).toEqual(
      Array(3).fill(`Bearer ${ROTATED.token}`),
    );
    expect(await readRemangaServiceSession(path)).toEqual(ROTATED);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not rotate again when a chapter rejects the renewed Bearer but the profile accepts it', async () => {
    const { path, http, getPages, warn } = await makeParser(EXPIRED, null);
    const fetch = vi.fn(async () => tokenPairResponse());
    vi.stubGlobal('fetch', fetch);
    await expect(getPages()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await expect(getPages()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    const chapterRequests = http.requests.filter(({ url }) => url === `${API}${CHAPTER_PATH}`);
    expect(chapterRequests.map(({ headers }) => headers.Authorization)).toEqual([
      undefined,
      `Bearer ${EXPIRED.token}`,
      `Bearer ${ROTATED.token}`,
      undefined,
      `Bearer ${ROTATED.token}`,
    ]);
    expect(await readRemangaServiceSession(path)).toEqual(ROTATED);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('retries a late 401 with the new Bearer while a different chapter is checking it', async () => {
    const { http, getPages } = await makeParser(EXPIRED);
    const fetch = vi.fn(async () => tokenPairResponse());
    vi.stubGlobal('fetch', fetch);
    const blockedPath = '/api/v2/titles/chapters/43/';
    http.register((url) => url === `${API}${blockedPath}`, { status: 401, body: '' });

    const oldRequestSent = createDeferred<void>();
    const releaseOldResponse = createDeferred<void>();
    const profileRequestSent = createDeferred<void>();
    const releaseProfileResponse = createDeferred<void>();
    const request = http.request.bind(http);
    let holdOldResponse = true;
    let holdProfileResponse = false;
    vi.spyOn(http, 'request').mockImplementation(async (req) => {
      const response = await request(req);
      if (
        holdOldResponse &&
        req.url === `${API}${CHAPTER_PATH}` &&
        req.headers?.Authorization === `Bearer ${EXPIRED.token}`
      ) {
        holdOldResponse = false;
        oldRequestSent.resolve();
        await releaseOldResponse.promise;
      }
      if (holdProfileResponse && req.url === `${API}${PROFILE_PATH}`) {
        profileRequestSent.resolve();
        await releaseProfileResponse.promise;
      }
      return response;
    });

    const lateRequest = getPages();
    await oldRequestSent.promise;
    await expect(getPages()).resolves.toHaveLength(1);
    holdProfileResponse = true;
    const blockedRequest = expect(getPages(blockedPath)).rejects.toBeInstanceOf(
      SourceAuthRequiredError,
    );
    await profileRequestSent.promise;

    releaseOldResponse.resolve();
    const expectLateSuccess = expect(lateRequest).resolves.toHaveLength(1);
    try {
      await vi.waitFor(() => {
        expect(
          http.requests.filter(
            ({ url, headers }) =>
              url === `${API}${CHAPTER_PATH}` &&
              headers.Authorization === `Bearer ${ROTATED.token}`,
          ),
        ).toHaveLength(2);
      });
    } finally {
      releaseProfileResponse.resolve();
      await Promise.all([expectLateSuccess, blockedRequest]);
    }
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('requires manual login when the profile rejects the renewed Bearer', async () => {
    const { path, getPages, warn } = await makeParser(EXPIRED, null, null);
    const fetch = vi.fn(async () => tokenPairResponse());
    vi.stubGlobal('fetch', fetch);
    await expect(getPages()).rejects.toThrow('login:remanga');
    await expect(getPages()).rejects.toBeInstanceOf(SourceTokenExpiredError);
    expect(await readRemangaServiceSession(path)).toEqual({ token: EXPIRED.token });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('login:remanga'));
  });

  it('continues to read a legacy token file and asks for manual login when that token expires', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { getPages, warn } = await makeParser({ token: EXPIRED.token });
    await expect(getPages()).rejects.toThrow('login:remanga');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([403, 500])(
    'requires manual login after a refresh response with HTTP %s and never replays it',
    async (status) => {
      const { path, getPages, warn } = await makeParser(EXPIRED);
      const fetch = vi.fn(async () =>
        Response.json({ detail: { message: EXPIRED.refreshToken } }, { status }),
      );
      vi.stubGlobal('fetch', fetch);
      await expect(getPages()).rejects.toThrow('login:remanga');
      await expect(getPages()).rejects.toBeInstanceOf(SourceTokenExpiredError);
      expect(await readRemangaServiceSession(path)).toEqual({ token: EXPIRED.token });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('login:remanga'));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining(EXPIRED.refreshToken));
    },
  );

  it('retries a failed write with the same rotated pair instead of refreshing again', async () => {
    const { path, getPages } = await makeParser(EXPIRED);
    const fetch = vi.fn(async () => {
      await rm(path);
      await mkdir(path);
      return tokenPairResponse();
    });
    vi.stubGlobal('fetch', fetch);
    await expect(getPages()).rejects.toBeInstanceOf(SourceSessionStorageError);
    await rm(path, { recursive: true });
    await expect(getPages()).resolves.toHaveLength(1);
    expect(await readRemangaServiceSession(path)).toEqual(ROTATED);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('ReManga service session file', () => {
  it('saves the pair outside the repository, loads it and restricts permissions', async () => {
    const path = await makeSessionPath();
    expect(await readRemangaServiceSession(path)).toBeNull();
    await writeRemangaServiceSession(path, ROTATED);
    expect(await readRemangaServiceSession(path)).toEqual(ROTATED);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(ROTATED);
    if (process.platform !== 'win32') {
      expect((await stat(path)).mode & 0o777).toBe(0o600);
    }
  });

  it('replaces a saved session without leaving temporary files', async () => {
    const path = await makeSessionPath();
    await writeRemangaServiceSession(path, { token: TOKEN });
    expect(await readRemangaServiceSession(path)).toEqual({ token: TOKEN });
    await writeRemangaServiceSession(path, ROTATED);
    expect(await readRemangaServiceSession(path)).toEqual(ROTATED);
    expect(await readdir(dirname(path))).toEqual(['remanga.json']);
  });

  it('rejects invalid token data', async () => {
    const path = await makeSessionPath();
    await expect(writeRemangaServiceSession(path, { token: 'bad' })).rejects.toThrow(
      'Invalid ReManga service token',
    );
    await expect(
      writeRemangaServiceSession(path, { token: TOKEN, refreshToken: 'bad' }),
    ).rejects.toThrow('Invalid ReManga service refresh token');
  });

  it('keeps malformed file contents out of parse errors', async () => {
    const path = await makeSessionPath();
    await writeFile(path, TOKEN, { mode: 0o600 });
    await expect(readRemangaServiceSession(path)).rejects.toThrow(
      /^Invalid ReManga service session file$/,
    );
  });
});
