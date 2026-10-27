import { CookieJar } from 'tough-cookie';
import type { HttpClient } from '../../core/http/client';
import { UserAgents } from '../../core/http/user-agents';

/**
 * Cookie сессии сайта сети inuko — host-only на домене сайта (inkstory.net, v1.puremanga.me),
 * живёт больше года (проверено 2026-10-27). Пользователь в сети один: id у сессии любого сайта
 * общий, поэтому одной cookie хватает на всю сеть.
 */
export const INUKO_SESSION_COOKIE = '__otaku_session';

/** Значение cookie: без пробелов, `;` и кавычек — то, что DevTools показывает в колонке Value. */
const SESSION_VALUE_REGEX = /^[\w.~+/=-]+$/;

/**
 * Состояние роутера в SSR-разметке: `currentUser:null` у гостя, у вошедшего — объект с id и
 * именем первыми полями (сериализатор seroval, `$R[n]=` перед объектом). Проверено 2026-10-27.
 */
const CURRENT_USER_REGEX = /currentUser:\$R\[\d+\]=\{id:"([0-9a-f-]{36})",username:"([^"]*)"/;

/** Страница, на которой сайт называет вошедшего, — самая лёгкая из тех, что рендерит SSR. */
const VIEWER_PAGE_PATH = '/faq';

export type InukoViewer = {
  id: string;
  username: string;
};

/**
 * Разбирает то, что человек скопировал из DevTools: само значение cookie, пару
 * `__otaku_session=…` или целую строку заголовка Cookie. null — сессии в тексте нет.
 */
export const parseInukoSessionValue = (value: string): string | null => {
  const text = value.trim();
  const pair = text
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${INUKO_SESSION_COOKIE}=`));
  const session = pair ? pair.slice(INUKO_SESSION_COOKIE.length + 1) : text;
  return SESSION_VALUE_REGEX.test(session) ? session : null;
};

/** Свежий jar с одной cookie сессии на домене сайта — его и хранит аккаунт пользователя. */
export const createInukoSessionJar = async (domain: string, session: string) => {
  const jar = new CookieJar();
  await jar.setCookie(
    `${INUKO_SESSION_COOKIE}=${session}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    `https://${domain}/`,
  );
  return jar;
};

/** Домен сайта, на котором лежит cookie сессии в jar аккаунта; null — сессии в jar нет. */
export const findInukoSessionDomain = async (jar: CookieJar): Promise<string | null> => {
  const { cookies } = await jar.serialize();
  const domain = cookies.find((cookie) => cookie.key === INUKO_SESSION_COOKIE)?.domain;
  return typeof domain === 'string' ? domain : null;
};

/** Кто вошёл по разметке страницы; null — гость. */
export const parseInukoViewer = (html: string): InukoViewer | null => {
  const match = CURRENT_USER_REGEX.exec(html);
  return match ? { id: match[1]!, username: match[2]! } : null;
};

/**
 * Аккаунт, от которого идут запросы: http сам кладёт cookie сессии из jar. Сайт за ddos-guard,
 * поэтому, как и ключ расшифровки, страница запрашивается с браузерным User-Agent.
 */
export const fetchInukoViewer = async (
  http: HttpClient,
  domain: string,
): Promise<InukoViewer | null> => {
  const res = await http.get(`https://${domain}${VIEWER_PAGE_PATH}`, {
    'User-Agent': UserAgents.CHROME_DESKTOP,
  });
  return parseInukoViewer(res.text());
};
