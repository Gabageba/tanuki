/**
 * Diagnostic browser login for ReManga.
 *
 * Usage: pnpm --filter @tanuki/parsers login:remanga
 *
 * Opens a real browser for a manual CAPTCHA/login and prints ONLY JSON field names
 * from relevant authentication responses. No token values, passwords, URLs with
 * query parameters, browser storage, or cookies are saved or logged.
 *
 * This is deliberately not a service-token provisioning script yet: the actual
 * response schema and refresh-token lifecycle still need to be confirmed.
 */
import { chromium, type Response } from 'playwright';

const SITE_URL = 'https://remanga.org/';
const API_ORIGIN = 'https://api.remanga.org';

const AUTH_PATH = /\/(?:login|auto-login|token\/refresh|app-auth\/token|2fa\/verify)\/?$/i;

const printKeys = (label: string, value: unknown): void => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  console.log(`  ${label}: ${Object.keys(value).join(', ') || '(пусто)'}`);
};

const inspectResponse = async (response: Response): Promise<void> => {
  const url = new URL(response.url());
  if (url.origin !== API_ORIGIN || !AUTH_PATH.test(url.pathname)) return;

  // Show only the path (never query parameters) and metadata, never response values.
  console.log(`[ReManga] ${response.request().method()} ${url.pathname}: HTTP ${response.status()}`);

  try {
    const body: unknown = await response.json();
    printKeys('Поля ответа', body);
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const record = body as Record<string, unknown>;
      printKeys('Поля content', record.content);
      printKeys('Поля data', record.data);
      printKeys('Поля detail', record.detail);
      printKeys('Поля token', record.token);
    }
  } catch {
    console.log('  Ответ не JSON или тело недоступно');
  }
};

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pending = new Set<Promise<void>>();

    context.on('response', (response) => {
      const task = inspectResponse(response).catch(() => {
        console.log('  Не удалось прочитать ответ авторизации');
      });
      pending.add(task);
      void task.finally(() => pending.delete(task));
    });

    console.log('Войди на ReManga в открывшемся браузере, пройди капчу вручную.');
    console.log('После входа вернись в терминал и нажми Enter.');
    console.log('Скрипт выводит только названия полей, не значения токенов.');

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
    await Promise.allSettled([...pending]);

    // Cookie names help locate opaque session/refresh credentials without disclosure.
    const cookies = await context.cookies();
    const names = cookies
      .filter(({ name }) => /auth|refresh|token/i.test(name))
      .map(({ name }) => name);
    console.log(`Названия auth-cookie: ${names.join(', ') || '(не обнаружены)'}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
