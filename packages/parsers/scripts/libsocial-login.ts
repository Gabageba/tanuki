/**
 * One-time (well — every few months, until the refresh_token itself is revoked) interactive
 * login for a LibSocial network member (MANGALIB/HENTAILIB/YAOILIB). The site's login form is
 * reCAPTCHA-gated, so this can't be a plain HTTP POST like Grouple's auth.ts — it opens a real,
 * visible Chromium window, a human logs in and solves the captcha in it, and this script grabs
 * the resulting OAuth `code` straight from the address bar the instant the browser lands back
 * on the site's own callback URL (before that page's own JS has a chance to consume the code
 * itself), then exchanges it for an access/refresh token pair using its own PKCE verifier.
 *
 * Usage: pnpm --filter @tanuki/parsers login:libsocial [SOURCE_ID]   (default: hentailib)
 * Optionally set LIB_USERNAME / LIB_PASSWORD to prefill the login form — one account covers
 * the whole network (MANGALIB/HENTAILIB/YAOILIB), not just the source you're logging into.
 * The reCAPTCHA still needs a human regardless, this just saves typing credentials each time.
 */
import { randomBytes, createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { chromium, type Frame } from 'playwright';
import { catalogEntryFor, SOURCE_ID } from '../src/sources/catalog';
import { LIBSOCIAL_CONFIGS } from '../src/sources/libsocial/config';
import { writeTokenStore, type LibSocialTokenState } from '../src/sources/libsocial/token-store';

// Best-effort — LIB_USERNAME/PASSWORD and LIBSOCIAL_TOKEN_STORE_DIR can live alongside
// GROUPLE_USERNAME etc. in apps/api/.env rather than needing a separate file. Silently no-ops
// if that file doesn't exist (e.g. CI, or someone passing env vars inline instead).
loadDotenv({ path: resolve(__dirname, '../../../apps/api/.env'), quiet: true });

const LOGIN_TIMEOUT_MS = 5 * 60_000;

type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

const base64url = (buf: Buffer): string => {
  return buf.toString('base64url');
};

const main = async (): Promise<void> => {
  const sourceId = process.argv[2] ?? SOURCE_ID.HENTAILIB;
  const cfg = LIBSOCIAL_CONFIGS.find((c) => c.id === sourceId);
  if (!cfg) {
    throw new Error(
      `Неизвестный источник '${sourceId}'. Доступные: ${LIBSOCIAL_CONFIGS.map((c) => c.id).join(', ')}`,
    );
  }
  if (!cfg.auth) {
    throw new Error(
      `У ${sourceId} нет конфигурации auth в sources/libsocial/config.ts — формат его логина ещё не снят с реального трафика.`,
    );
  }
  const auth = cfg.auth;

  // Same relative default as apps/api's config/env.ts LIBSOCIAL_TOKEN_STORE_DIR — both resolve
  // against their own package directory, two levels below the repo root.
  const tokenStoreDir =
    process.env.LIBSOCIAL_TOKEN_STORE_DIR ?? resolve(process.cwd(), '../../data/libsocial-tokens');
  const tokenStorePath = join(tokenStoreDir, `${cfg.id}.json`);

  const codeVerifier = base64url(randomBytes(64));
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());
  const state = base64url(randomBytes(24));

  const authorizeUrl = new URL(`${auth.authOrigin}/auth/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', auth.clientId);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('iframe', 'false');
  authorizeUrl.searchParams.set('prompt', 'consent');
  authorizeUrl.searchParams.set('redirect_uri', auth.redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', '');
  authorizeUrl.searchParams.set('state', state);

  // Optional convenience — the login form field itself is named "login" on the wire (captured
  // POST body: `login=...&password=...`); LIB_USERNAME is just this script's env var name for
  // it, since one account logs into every LibSocial member, not only the one being targeted
  // here. Only the reCAPTCHA is left for the human either way; this just saves them typing.
  // Unset -> the browser opens on a blank login form as before.
  const login = process.env.LIB_USERNAME;
  const password = process.env.LIB_PASSWORD;

  console.log(`Открываю браузер для входа в ${catalogEntryFor(cfg.id).title}...`);
  console.log(
    login && password
      ? 'Логин/пароль подставлены — останется решить капчу и нажать кнопку входа.'
      : 'Войди в аккаунт и реши капчу — окно закроется само, как только это удастся.',
  );

  const redirectOrigin = new URL(auth.redirectUri).origin;

  const browser = await chromium.launch({ headless: false });
  let code: string;
  try {
    // Registered at the *context* level, not the page level — the consent step's "продолжить
    // как" button may open the redirect in a new tab/popup rather than navigating the original
    // page, and a page-scoped listener only ever sees events from the page it was attached to.
    const context = await browser.newContext();
    const page = await context.newPage();

    // `framenavigated` fires as soon as a frame commits to a new URL — before that page's own
    // JS has started running, since JS execution only starts once the DOM begins parsing. That
    // makes it early enough to beat hentailib.me's own frontend to the `code` (it would
    // otherwise try to consume it itself, with its own — different — code_verifier, burning our
    // single-use code first). An earlier attempt tried to intercept-and-abort the network
    // request instead so that page would never load at all, but that didn't reliably fire in
    // practice — reading the URL off the commit event is simpler and, empirically, works.
    const captured = new Promise<{ code: string; state: string | null }>(
      (resolveCapture, rejectCapture) => {
        const onFrameNavigated = (frame: Frame): void => {
          console.log(`  → ${frame.url()}`);
          const url = new URL(frame.url());
          if (url.origin !== redirectOrigin) return;
          const returnedCode = url.searchParams.get('code');
          const oauthError = url.searchParams.get('error');
          if (oauthError) rejectCapture(new Error(`Сайт вернул ошибку авторизации: ${oauthError}`));
          else if (returnedCode)
            resolveCapture({ code: returnedCode, state: url.searchParams.get('state') });
        };
        page.on('framenavigated', (frame) => {
          if (frame === page.mainFrame()) onFrameNavigated(frame);
        });
        context.on('page', (popup) => {
          console.log('  (открылась новая вкладка)');
          popup.on('framenavigated', (frame) => {
            if (frame === popup.mainFrame()) onFrameNavigated(frame);
          });
        });
      },
    );

    console.log('Навигация:');
    await page.goto(authorizeUrl.toString());

    if (login && password) {
      try {
        await page.fill('input[name="login"]', login, { timeout: 15_000 });
        await page.fill('input[name="password"]', password, { timeout: 15_000 });
      } catch {
        console.log('Не нашёл поля логина/пароля на странице — заполни их вручную.');
      }
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Не дождался логина за 5 минут — попробуй ещё раз.')),
        LOGIN_TIMEOUT_MS,
      ),
    );
    const { code: returnedCode, state: returnedState } = await Promise.race([captured, timeout]);
    if (returnedState !== state) {
      throw new Error(
        'state в ответе не совпадает с отправленным — похоже на устаревшую навигацию, попробуй ещё раз.',
      );
    }
    code = returnedCode;
  } finally {
    await browser.close();
  }

  console.log('Код получен, обмениваю на токен...');
  const res = await fetch(auth.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'site-id': String(cfg.siteId),
      origin: redirectOrigin,
      referer: `${redirectOrigin}/`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: auth.clientId,
      redirect_uri: auth.redirectUri,
      code_verifier: codeVerifier,
      code,
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Обмен code на токен не удался: HTTP ${res.status} — ${bodyText}`);
  }
  const json = JSON.parse(bodyText) as TokenResponse;
  const state_: LibSocialTokenState = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  await writeTokenStore(tokenStorePath, state_);
  console.log(`Готово. Токен сохранён в ${tokenStorePath}`);
  console.log(
    `Действителен до ${new Date(state_.expiresAt).toISOString()}, дальше обновляется сам.`,
  );
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
