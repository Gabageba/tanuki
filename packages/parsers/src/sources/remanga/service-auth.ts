import type { ParserContext } from '../../core/parser';
import {
  SourceAuthRequiredError,
  SourceSessionStorageError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../../errors';
import { SOURCE_ID } from '../catalog';
import { fetchRemangaAccountJson, fetchRemangaViewer } from './auth';
import { REMANGA_TOKEN_REGEX, type RemangaServiceSession, type RemangaTokenPair } from './models';
import { readRemangaServiceSession, writeRemangaServiceSession } from './service-session';

const REMANGA = SOURCE_ID.REMANGA;
const RELOGIN_MESSAGE =
  'ReManga service session must be renewed by running pnpm --filter @tanuki/parsers login:remanga';
const RESOURCE_AUTH_MESSAGE = 'ReManga service session cannot access this resource';

const requestTokenPair = async (
  domain: string,
  path: string,
  body: Record<string, string>,
  bearer?: string,
): Promise<RemangaTokenPair> => {
  // Each POST can rotate the token. Send it once, directly, without cookies or redirects.
  const response = await fetch(`https://api.${domain}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  }).catch(() => {
    throw new SourceUnavailableError('ReManga token request failed', REMANGA);
  });

  if (response.status !== 200) {
    if (response.body) await response.body.cancel().catch(() => undefined);
    throw new SourceUnavailableError(
      `ReManga token endpoint returned HTTP ${response.status}`,
      REMANGA,
    );
  }

  const json: unknown = await response.json().catch(() => null);
  if (
    !json ||
    typeof json !== 'object' ||
    !('access_token' in json) ||
    typeof json.access_token !== 'string' ||
    !REMANGA_TOKEN_REGEX.test(json.access_token) ||
    !('refresh_token' in json) ||
    typeof json.refresh_token !== 'string' ||
    !REMANGA_TOKEN_REGEX.test(json.refresh_token)
  ) {
    throw new SourceUnavailableError(
      'ReManga token response is missing a valid token pair',
      REMANGA,
    );
  }
  return { token: json.access_token, refreshToken: json.refresh_token };
};

export const upgradeRemangaServiceSession = (domain: string, token: string) =>
  requestTokenPair(domain, '/api/v2/users/token/upgrade/', {}, token);

export const createRemangaServiceAuth = (ctx: ParserContext) => {
  const sessionFile = ctx.credentials.remanga?.sessionFile;
  let session: RemangaServiceSession | null = null;
  let pendingWrite: RemangaTokenPair | null = null;
  let inFlight: Promise<string> | null = null;
  let needsLogin = false;

  const requireLogin = (reason?: string) => {
    if (!needsLogin) ctx.logger.warn(reason ? `${reason}. ${RELOGIN_MESSAGE}` : RELOGIN_MESSAGE);
    needsLogin = true;
    return new SourceTokenExpiredError(RELOGIN_MESSAGE, REMANGA);
  };

  const isTokenExpired = async (token: string) => {
    try {
      await fetchRemangaViewer(ctx.http, ctx.domain, token);
      return false;
    } catch (error) {
      if (!(error instanceof SourceTokenExpiredError)) throw error;
      return true;
    }
  };

  const refresh = async (rejectedToken: string) => {
    const current = session;
    if (needsLogin || !current || !sessionFile) throw requireLogin();
    if (current.token !== rejectedToken) return current.token;
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        if (!pendingWrite) {
          // A protected resource can reject a Bearer that still works for the account.
          if (!(await isTokenExpired(current.token))) {
            throw new SourceAuthRequiredError(RESOURCE_AUTH_MESSAGE, REMANGA);
          }
          if (!current.refreshToken) throw requireLogin();
          // Retire the refresh token on disk before sending it, even if the process stops mid-request.
          await writeRemangaServiceSession(sessionFile, { token: current.token }).catch(() => {
            throw new SourceSessionStorageError(
              'Could not prepare the ReManga session for rotation',
              REMANGA,
            );
          });
          pendingWrite = await requestTokenPair(ctx.domain, '/api/v2/users/token/refresh/', {
            refresh_token: current.refreshToken,
          }).catch((error: unknown) => {
            // A lost or malformed response may follow a successful rotation upstream.
            throw requireLogin(error instanceof SourceUnavailableError ? error.message : undefined);
          });
        }
        if (await isTokenExpired(pendingWrite.token)) {
          pendingWrite = null;
          throw requireLogin('ReManga rejected the renewed service session');
        }
        // Keep the rotated pair until verification and persistence succeed.
        await writeRemangaServiceSession(sessionFile, pendingWrite).catch(() => {
          throw new SourceSessionStorageError(
            'Could not save the rotated ReManga service session',
            REMANGA,
          );
        });
        session = pendingWrite;
        pendingWrite = null;
        return session.token;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  };

  const init = async () => {
    if (!sessionFile) return;
    session = await readRemangaServiceSession(sessionFile);
    ctx.logger.info(
      session ? 'ReManga service session loaded' : 'ReManga service session not configured',
    );
  };

  const getJson = async <T>(path: string): Promise<T> => {
    if (!session) throw new SourceAuthRequiredError('ReManga title requires login', REMANGA);
    const { token } = session;
    try {
      return await fetchRemangaAccountJson<T>(ctx.http, ctx.domain, token, path);
    } catch (error) {
      if (!(error instanceof SourceTokenExpiredError)) throw error;
      const next = await refresh(token);
      return fetchRemangaAccountJson<T>(ctx.http, ctx.domain, next, path).catch(
        (retryError: unknown) => {
          if (!(retryError instanceof SourceTokenExpiredError)) throw retryError;
          throw new SourceAuthRequiredError(RESOURCE_AUTH_MESSAGE, REMANGA);
        },
      );
    }
  };

  return { init, getJson };
};
