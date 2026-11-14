/**
 * Diagnostic browser login for ReManga.
 *
 * Usage: pnpm --filter @tanuki/parsers login:remanga [--check-refresh | --check-bff | --inspect-bff]
 *
 * Opens a real browser for a manual CAPTCHA/login and prints ONLY JSON field names
 * from authentication-related responses on remanga.org subdomains. No token values, passwords, URLs with
 * query parameters, browser storage, or cookies are saved or logged.
 *
 * This is deliberately not a service-token provisioning script yet: the actual
 * response schema and refresh-token lifecycle still need to be confirmed.
 */
import { chromium, type Response } from 'playwright';

const SITE_URL = 'https://remanga.org/';
const API_ORIGIN = 'https://api.remanga.org';
const AUTH_ROUTE = /(?:auth|login|refresh|token|session|oauth|sso|users\/current)/i;
const MAX_EVENTS = 80;
const BFF_STATIC_KEYS = ['bff-api/auth/', 'auth:server-token', 'auth:token', 'token/refresh/', 'refresh_token', 'credentials'];
const SAFE_AUTH_FIELDS = new Set(['token', 'access_token', 'refresh_token', 'user', 'username', 'password', 'method', 'provider', 'type', 'expires_in', 'expires_at', 'id']);

const AUTH_PATH = AUTH_ROUTE;

const printKeys = (label: string, value: unknown): void => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  console.log(`  ${label}: ${Object.keys(value).join(', ') || '(пусто)'}`);
};

const inspectResponse = async (response: Response): Promise<void> => {
  const url = new URL(response.url());
  if (!url.hostname.endsWith('remanga.org') || !AUTH_PATH.test(url.pathname)) return;

  // Show only the path (never query parameters) and metadata, never response values.
  console.log(`[ReManga] ${response.request().method()} ${url.pathname}: HTTP ${response.status()}`);
  const setCookieNames = (await response.headersArray())
    .filter(({ name }) => name.toLowerCase() === 'set-cookie')
    .map(({ value }) => value.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name));
  if (setCookieNames.length > 0) {
    console.log('  Set-Cookie names:', setCookieNames.join(', '));
  }

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
    const initialCookies = await context.cookies();
    let eventCount = 0;
    const inspectedChunks = new Map<string, string[]>();
    const codeSamples = new Map<string, string[]>();
    const refreshMentions = new Map<string, string[]>();
    const authRequests: string[] = [];
    let inspectedCount = 0;

    context.on('request', (request) => {
      if (!process.argv.includes('--inspect-bff')) return;
      const url = new URL(request.url());
      if (!url.hostname.endsWith('remanga.org') || !/\/bff-api\/auth\/|\/token\/refresh\//.test(url.pathname)) return;
      const parsed: unknown = (() => {
        try { return request.postDataJSON(); } catch { return null; }
      })();
      let fields = '(без JSON body)';
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        const safeKeys = keys.filter((key) => SAFE_AUTH_FIELDS.has(key));
        fields = safeKeys.join(', ') || '(нет известных полей)';
        if (safeKeys.length !== keys.length) fields += ' (+ неизвестных полей: ' + (keys.length - safeKeys.length) + ')';
      }
      authRequests.push(request.method() + ' ' + url.pathname + ' — поля JSON: ' + fields);
    });

    context.on('response', (response) => {
      if (process.argv.includes('--inspect-bff') && inspectedCount < 80) {
        const url = new URL(response.url());
        if (url.hostname.endsWith('remanga.org') && /\.js(?:$)/i.test(url.pathname) && response.status() === 200) {
          inspectedCount += 1;
          const task = response.text().then((source) => {
            const matches = BFF_STATIC_KEYS.filter((key) => source.includes(key));
            if (matches.length) {
              const paths = [...source.matchAll(/\/bff-api\/auth\/[a-z][a-z0-9/_-]{0,80}/gi)]
                .map((match) => match[0]);
              const distinct = [...new Set(paths)].slice(0, 20);
              inspectedChunks.set(url.pathname.split('/').pop() ?? 'chunk', [...matches, ...distinct]);
              const refreshPatterns = ['refresh_token', 'token/refresh/', 'yu(', '.yu(', 'refreshToken', 'auth:server-token'];
              const found = refreshPatterns.filter((pattern) => source.includes(pattern));
              if (found.length) refreshMentions.set(url.pathname.split('/').pop() ?? 'chunk', found);
              const filename = url.pathname.split('/').pop() ?? 'chunk';
              const wantedFiles = /^(?:99868-|77638-|40225-|page-e421eea)/.test(filename);
              if (wantedFiles) {
                const sections: string[] = [];
                for (const keyword of ['token/refresh/', 'auth:server-token', 'auth:token', '/bff-api/auth/credentials']) {
                  let from = 0;
                  for (let i = 0; i < 2; i += 1) {
                    const index = source.indexOf(keyword, from);
                    if (index < 0) break;
                    const start = Math.max(0, index - 220);
                    const end = Math.min(source.length, index + keyword.length + 260);
                    const fragment = source.slice(start, end).replace(/\s+/g, ' ');
                    sections.push(keyword + ': ' + fragment);
                    from = index + keyword.length;
                  }
                }
                if (sections.length) codeSamples.set(filename, sections);
              }
            }
          }).catch(() => {});
          pending.add(task);
          void task.finally(() => pending.delete(task));
        }
      }
      if (eventCount >= MAX_EVENTS) return;
      const url = new URL(response.url());
      if (!url.hostname.endsWith('remanga.org') || !AUTH_ROUTE.test(url.pathname)) return;
      eventCount += 1;
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
    const loadedCookies = await context.cookies();
    console.log('Cookie при первой загрузке:', loadedCookies.filter((c) => /auth|token|session|refresh/i.test(c.name)).map((c) => c.name).join(', ') || '(нет)');
    await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
    await Promise.allSettled([...pending]);
    if (process.argv.includes('--inspect-bff')) {
      console.log('BFF: анализ статических JS-файлов, без вывода исходного кода:');
      console.log('Просмотрено JS-файлов:', inspectedCount);
      for (const [chunk, matches] of inspectedChunks) {
        console.log('  ' + chunk + ': ' + matches.join(', '));
      }
      if (inspectedChunks.size === 0) console.log('  Совпадений не обнаружено');
      console.log('BFF: фрагменты публичного JS вокруг ключевых вызовов:');
      for (const [filename, samples] of codeSamples) {
        console.log('  Файл: ' + filename);
        for (const sample of samples) console.log('    ' + sample);
      }
      if (codeSamples.size === 0) console.log('  Целевые участки не найдены');
      console.log('BFF: сетевые запросы авторизации и структура переданных данных:');
      for (const request of authRequests) console.log('  ' + request);
      if (!authRequests.length) console.log('  Запросов не обнаружено');
      console.log('BFF: упоминания refresh в загруженных модулях:');
      for (const [filename, patterns] of refreshMentions) console.log('  ' + filename + ': ' + patterns.join(', '));
      if (!refreshMentions.size) console.log('  Упоминаний не обнаружено');
      console.log('Вызовы в динамически не загруженных модулях этим способом не проверяются.');
      console.log('Код серверных обработчиков BFF в клиентских JS-файлах может отсутствовать.');
    }

    // Cookie names help locate opaque session/refresh credentials without disclosure.
    const cookies = await context.cookies();
    const names = cookies
      .filter(({ name }) => /auth|refresh|token/i.test(name))
      .map(({ name }) => name);
    console.log(`Названия auth-cookie: ${names.join(', ') || '(не обнаружены)'}`);
    const earlier = new Map(loadedCookies.map((c) => [`${c.domain}:${c.name}`, c]));
    const changed = cookies.filter((c) => /auth|token|session|refresh/i.test(c.name) && (!earlier.has(`${c.domain}:${c.name}`) || earlier.get(`${c.domain}:${c.name}`)?.expires !== c.expires));
    console.log('Новые cookie или изменён срок действия:', changed.map((c) => `${c.name} (${c.domain}; ${c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session'})`).join(', ') || '(нет)');
    console.log('Cookie изначально:', initialCookies.filter((c) => /auth|token|session|refresh/i.test(c.name)).map((c) => c.name).join(', ') || '(нет)');
    try {
      const storage = await page.evaluate(() => ({
        local: Object.keys(localStorage).filter((key) => /auth|token|refresh|session/i.test(key)),
        session: Object.keys(sessionStorage).filter((key) => /auth|token|refresh|session/i.test(key)),
      }));
      console.log('Local Storage keys:', storage.local.join(', ') || '(нет)');
      console.log('Session Storage keys:', storage.session.join(', ') || '(нет)');
    } catch {
      console.log('Storage keys недоступны');
    }

    if (process.argv.includes('--check-bff')) {
      console.log('BFF: обновляю страницу с уже существующей авторизацией.');
      const beforeReload = new Map(
        cookies
          .filter(({ name }) => /auth|token|session|refresh/i.test(name))
          .map((cookie) => [`${cookie.domain}:${cookie.name}`, cookie]),
      );
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForTimeout(3000);
        const afterReload = await context.cookies();
        for (const cookie of afterReload.filter(({ name }) => /auth|token|session|refresh/i.test(name))) {
          const before = beforeReload.get(`${cookie.domain}:${cookie.name}`);
          console.log(
            `BFF cookie ${cookie.name}: ${before ? (before.value === cookie.value ? 'значение не изменилось' : 'значение изменилось') : 'новая cookie'}, ${before && before.expires !== cookie.expires ? 'срок изменился' : 'срок не изменился'}`,
          );
        }
        console.log('BFF: проверка одного повторного открытия завершена. Это не тест истечения токена.');
      } catch (error) {
        console.log('BFF: ошибка перезагрузки:', error instanceof Error ? error.name : 'unknown');
      }
    }

    if (process.argv.includes('--check-refresh')) {
      const serverToken = cookies.find((cookie) => cookie.name === 'auth:server-token');
      if (!serverToken?.value) {
        console.log('Проверка refresh: cookie auth:server-token не найдена.');
      } else {
        console.log('Проверяю auth:server-token как refresh_token (одноразовая попытка).');
        console.log('Внимание: при успешном обновлении исходная сессия может стать недействительной.');
        try {
          const refresh = await context.request.post(
            'https://api.remanga.org/api/v2/users/token/refresh/',
            {
              data: { refresh_token: serverToken.value },
              headers: { 'content-type': 'application/json' },
              failOnStatusCode: false,
              timeout: 15_000,
            },
          );
          console.log('Refresh HTTP:', refresh.status());
          try {
            const body: unknown = await refresh.json();
            printKeys('Поля ответа refresh', body);
            if (body && typeof body === 'object' && !Array.isArray(body)) {
              const record = body as Record<string, unknown>;
              printKeys('Поля content refresh', record.content);
              printKeys('Поля data refresh', record.data);
              printKeys('Поля detail refresh', record.detail);
              for (const key of ['access_token', 'refresh_token', 'token', 'error', 'code']) {
                console.log('  Есть поле ' + key + ': ' + Object.hasOwn(record, key));
              }
            }
          } catch {
            console.log('Refresh: ответ не JSON.');
          }
          console.log('Результат диагностический: новые токены не сохраняются.');
        } catch (error) {
          console.log(
            'Ошибка refresh-запроса:',
            error instanceof Error ? error.name : 'unknown',
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
