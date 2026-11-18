/**
 * One-time browser login for ReManga's service account.
 *
 * Usage: pnpm --filter @tanuki/parsers login:remanga
 *
 * ReManga uses CAPTCHA / external login providers; the user signs in manually.
 * The resulting browser token is exchanged for a token pair, verified and
 * saved in a gitignored file. No credentials or token values are logged.
 */
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { parseRemangaSessionValue, REMANGA_SESSION_COOKIE } from '../src/sources/remanga/auth';
import { upgradeRemangaServiceSession } from '../src/sources/remanga/service-auth';
import { writeRemangaServiceSession } from '../src/sources/remanga/service-session';

const DOMAIN = 'remanga.org';
const SITE_URL = `https://${DOMAIN}/`;
const VERIFY_URL = `https://api.${DOMAIN}/api/v2/users/current/`;
const SESSION_FILE =
  process.env.REMANGA_SESSION_FILE ??
  resolve(process.cwd(), '../../data/libsocial-tokens/remanga.json');

const main = async (): Promise<void> => {
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
    token = cookies.find(({ name }) => name === REMANGA_SESSION_COOKIE)?.value;
  } finally {
    await browser.close();
  }

  const bearer = token && parseRemangaSessionValue(token);
  if (!bearer) {
    throw new Error('ReManga auth:token не обнаружен. Сессия не сохранена.');
  }

  const session = await upgradeRemangaServiceSession(DOMAIN, bearer);
  const response = await fetch(VERIFY_URL, {
    headers: { Authorization: `Bearer ${session.token}` },
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  }).catch(() => {
    throw new Error('Не удалось проверить сервисную сессию ReManga. Токены не сохранены.');
  });
  if (response.body) await response.body.cancel().catch(() => undefined);
  if (response.status !== 200) {
    throw new Error(
      `ReManga Bearer-проверка вернула HTTP ${response.status}. Токены не сохранены.`,
    );
  }

  await writeRemangaServiceSession(SESSION_FILE, session);
  console.log(`Сервисная сессия ReManga сохранена: ${SESSION_FILE}`);
  console.log(
    'Значения токенов не выводятся. Для сервера скопируй файл в смонтированный каталог данных.',
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
