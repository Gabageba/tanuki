/**
 * One-time browser login for ReManga's service account.
 *
 * Usage: pnpm --filter @tanuki/parsers login:remanga
 *
 * ReManga uses CAPTCHA / external login providers; the user signs in manually.
 * The resulting browser cookie is verified against the API and written to a
 * gitignored token file for the server. No credentials or token values are logged.
 * Refresh is not supported until its actual contract has been established.
 */
import { resolve } from 'node:path';
import { chromium, request } from 'playwright';
import { writeRemangaServiceSession } from '../src/sources/remanga/service-session';

const SITE_URL = 'https://remanga.org/';
const VERIFY_URL = 'https://api.remanga.org/api/v2/users/current/';
const COOKIE_NAME = 'auth:token';
const SESSION_FILE =
  process.env.REMANGA_SESSION_FILE ??
  resolve(process.cwd(), '../../data/libsocial-tokens/remanga.json');

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  let token: string | undefined;
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Войди в сервисный аккаунт ReManga в открывшемся Chromium.');
    console.log('После успешного входа нажми Enter здесь. CAPTCHA проходится вручную.');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await new Promise<void>((done) => process.stdin.once('data', () => done()));

    const cookies = await context.cookies(SITE_URL);
    token = cookies.find(({ name }) => name === COOKIE_NAME)?.value;
  } finally {
    await browser.close();
  }

  if (!token) {
    throw new Error('ReManga auth:token не обнаружен. Сессия не сохранена.');
  }

  // A separate request context intentionally has no browser cookies: this checks
  // that the token itself works as Bearer, not just the browser's BFF session.
  const api = await request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  try {
    const response = await api.get(VERIFY_URL, { timeout: 20_000, maxRedirects: 0 });
    if (response.status() !== 200) {
      throw new Error(
        `ReManga Bearer-проверка вернула HTTP ${response.status()}. Токен не сохранён.`,
      );
    }
  } finally {
    await api.dispose();
  }

  await writeRemangaServiceSession(SESSION_FILE, { token });
  console.log(`Сервисная сессия ReManga сохранена: ${SESSION_FILE}`);
  console.log(
    'Значения токена не выводятся. Для сервера скопируй файл в смонтированный каталог данных.',
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
