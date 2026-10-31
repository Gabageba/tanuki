import { createHash } from 'node:crypto';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';
import { load, type CheerioAPI } from 'cheerio';
import { CookieJar, type SerializedCookieJar } from 'tough-cookie';
import { request as undiciRequest } from 'undici';
import { decodeBytes } from '../../core/html/dom';
import { decompress } from '../../core/http/decompress';
import type { GroupleCredentials } from '../../core/parser';
import type { LibSocialTokenState } from '../../core/source-accounts';
import {
  createLibSocialAuthorization,
  type LibSocialAuthorization,
  type LibSocialPkce,
} from './auth';
import type { LibSocialAuthConfig } from './config';

export type LoginHttpRequest = {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type LoginHttpResponse = {
  status: number;
  location: string | null;
  setCookie: string[];
  body: string;
};

/** Один HTTP-запрос без автоматических редиректов — их вход разбирает сам. */
export type LoginHttp = (req: LoginHttpRequest) => Promise<LoginHttpResponse>;

type AltchaChallenge = {
  algorithm: string;
  challenge: string;
  salt: string;
  signature: string;
  maxnumber?: number;
};

type HtmlForm = { action: string; fields: Record<string, string> };

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const MAX_REDIRECTS = 10;

/** Столько хешей ALTCHA считаем подряд, прежде чем отпустить event loop. */
const ALTCHA_BATCH = 5_000;

/** Потолок перебора, если сайт не прислал maxnumber, — значение по умолчанию самой ALTCHA. */
const ALTCHA_DEFAULT_MAX_NUMBER = 1_000_000;

const header = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value) ?? null;

const undiciLoginHttp: LoginHttp = async ({ method, url, headers, body }) => {
  const res = await undiciRequest(url, { method, headers, body });
  const bytes = Buffer.from(await res.body.arrayBuffer());
  const setCookie = res.headers['set-cookie'];
  return {
    status: res.statusCode,
    location: header(res.headers.location),
    setCookie: Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [],
    body: decodeBytes(
      decompress(bytes, header(res.headers['content-encoding']) ?? undefined),
      header(res.headers['content-type']) ?? undefined,
    ),
  };
};

/**
 * ALTCHA — proof-of-work, а не загадка для человека: найти число, для которого
 * hash(salt + число) совпадёт с challenge. Решается перебором за доли секунды.
 */
export const solveAltcha = async (challenge: AltchaChallenge): Promise<string | null> => {
  const algorithm = challenge.algorithm.toLowerCase().replace('-', '');
  const max = challenge.maxnumber ?? ALTCHA_DEFAULT_MAX_NUMBER;
  for (let start = 0; start <= max; start += ALTCHA_BATCH) {
    for (let number = start; number <= Math.min(start + ALTCHA_BATCH - 1, max); number += 1) {
      const hash = createHash(algorithm).update(`${challenge.salt}${number}`).digest('hex');
      if (hash === challenge.challenge) {
        const payload = {
          algorithm: challenge.algorithm,
          challenge: challenge.challenge,
          number,
          salt: challenge.salt,
          signature: challenge.signature,
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
      }
    }
    await yieldToEventLoop();
  }
  return null;
};

/** Поля формы как их отправил бы браузер: скрытые и заполненные input'ы, без кнопок. */
const readForm = ($: CheerioAPI, form: ReturnType<CheerioAPI>, baseUrl: string): HtmlForm => {
  const fields: Record<string, string> = {};
  form.find('input[name]').each((_, input) => {
    const $input = $(input);
    const type = ($input.attr('type') ?? 'text').toLowerCase();
    if (type === 'submit' || type === 'button') return;
    if ((type === 'checkbox' || type === 'radio') && $input.attr('checked') === undefined) return;
    fields[$input.attr('name') ?? ''] = $input.attr('value') ?? '';
  });
  return { action: new URL(form.attr('action') ?? baseUrl, baseUrl).toString(), fields };
};

/** Форма кода из письма (`/auth/login/otp`) — рядом с ней форма «Отправить ещё раз» без поля. */
const findCodeForm = ($: CheerioAPI) =>
  $('form')
    .filter((_, form) => $(form).find('input[autocomplete="one-time-code"]').length > 0)
    .first();

const findLoginForm = ($: CheerioAPI) =>
  $('form')
    .filter((_, form) => $(form).find('input[type="password"]').length > 0)
    .first();

/**
 * Страница «разрешить приложению доступ»: форма, отправляющая на oauth/authorize. У Laravel
 * Passport рядом стоит форма отказа — она шлёт `_method=DELETE`, её пропускаем.
 */
const findConsentForm = ($: CheerioAPI) =>
  $('form')
    .filter(
      (_, form) =>
        ($(form).attr('action') ?? '').includes('oauth/authorize') &&
        ($(form).attr('method') ?? '').toLowerCase() === 'post' &&
        $(form).find('input[name="_method"][value="DELETE" i]').length === 0,
    )
    .first();

/**
 * Вход, остановленный сайтом на коде из письма. Всё, что нужно, чтобы продолжить его позже
 * другим запросом: cookie сессии входа, секреты PKCE и форма кода. Сериализуется в JSON.
 */
export type LibSocialPendingLogin = {
  pkce: LibSocialPkce;
  cookies: SerializedCookieJar;
  /** Форма кода как есть, вместе с CSRF-токеном. */
  form: HtmlForm;
  /** Имя поля кода в форме. */
  codeField: string;
  /** Страница с формой — отправляется как Referer. */
  url: string;
};

/** Токены — вход завершён; pending — сайт ждёт код из письма; null — логин или пароль не подошли. */
export type LibSocialLoginResult =
  { tokens: LibSocialTokenState } | { pending: LibSocialPendingLogin } | null;

type LoginStep = { code: string } | { page: string; url: string };

/** Один вход на сайт: свой jar cookie и PKCE, запросы с заголовками браузера. */
const createLoginSession = (
  authorization: LibSocialAuthorization,
  jar: CookieJar,
  label: string,
  http: LoginHttp,
) => {
  const send = async (
    method: LoginHttpRequest['method'],
    url: string,
    extra: { body?: string; referer?: string; accept?: string } = {},
  ) => {
    const headers: Record<string, string> = {
      'user-agent': USER_AGENT,
      accept: extra.accept ?? 'text/html,application/xhtml+xml,*/*;q=0.8',
      'accept-language': 'ru-RU,ru;q=0.9',
    };
    const cookie = await jar.getCookieString(url);
    if (cookie) headers.cookie = cookie;
    if (extra.referer) {
      headers.referer = extra.referer;
      headers.origin = new URL(extra.referer).origin;
    }
    if (extra.body !== undefined) headers['content-type'] = 'application/x-www-form-urlencoded';
    const res = await http({ method, url, headers, body: extra.body });
    await Promise.all(res.setCookie.map((raw) => jar.setCookie(raw, url, { ignoreError: true })));
    return res;
  };

  /**
   * Идёт по редиректам, пока не придёт страница. Редирект на callback сайта не открывается:
   * код из его адреса и есть результат входа.
   */
  const follow = async (
    method: LoginHttpRequest['method'],
    startUrl: string,
    extra?: { body?: string; referer?: string },
  ): Promise<LoginStep> => {
    let url = startUrl;
    let res = await send(method, url, extra);
    for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
      if (res.status < 300 || res.status >= 400 || !res.location) return { page: res.body, url };
      url = new URL(res.location, url).toString();
      const code = authorization.readCallback(url);
      if (code) return { code };
      res = await send('GET', url);
    }
    throw new Error(`${label}: слишком много редиректов при входе`);
  };

  const submit = async (form: HtmlForm, referer: string) =>
    follow('POST', form.action, { body: new URLSearchParams(form.fields).toString(), referer });

  /**
   * Доводит вход до токенов после отправки формы: подтверждает доступ приложению, если сайт
   * спросил, и останавливается на коде из письма. null — сайт снова показал форму, которую
   * только что отправили (`retryForm`): логин, пароль или код не подошли.
   */
  const finish = async (
    submitted: LoginStep,
    retryForm: ($: CheerioAPI) => ReturnType<CheerioAPI>,
  ): Promise<LibSocialLoginResult> => {
    let step = submitted;
    if ('code' in step) return { tokens: await authorization.exchange(step.code) };

    let $ = load(step.page);
    const consentForm = findConsentForm($);
    if (consentForm.length > 0) {
      step = await submit(readForm($, consentForm, step.url), step.url);
      if ('code' in step) return { tokens: await authorization.exchange(step.code) };
      $ = load(step.page);
    }

    if (retryForm($).length > 0) return null;

    const codeForm = findCodeForm($);
    if (codeForm.length > 0) {
      const cookies = jar.serializeSync();
      if (!cookies) throw new Error(`${label}: не удалось сохранить cookie входа`);
      return {
        pending: {
          pkce: authorization.pkce,
          cookies,
          form: readForm($, codeForm, step.url),
          codeField: codeForm.find('input[autocomplete="one-time-code"]').attr('name') ?? 'code',
          url: step.url,
        },
      };
    }
    throw new Error(`${label}: после входа сайт не вернул код авторизации (${step.url})`);
  };

  return { send, follow, submit, finish };
};

/**
 * Вход в LibSocial логином и паролем — без браузера: тот же OAuth2 + PKCE, что проходит сайт,
 * только форму входа (с ALTCHA) заполняет сервер. Если сайт прислал код на почту, возвращает
 * начатый вход — его завершает `confirmLibSocialLogin`. Бросает, если страницы сайта оказались
 * не такими, как ожидалось, — значит, вход на сайте поменялся.
 */
export const loginLibSocialWithPassword = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  credentials: GroupleCredentials,
  label: string,
  http: LoginHttp = undiciLoginHttp,
): Promise<LibSocialLoginResult> => {
  const authorization = createLibSocialAuthorization(auth, siteId, label);
  const session = createLoginSession(authorization, new CookieJar(), label, http);

  const step = await session.follow('GET', authorization.authorizeUrl);
  if ('code' in step) return { tokens: await authorization.exchange(step.code) };

  const $ = load(step.page);
  const loginForm = findLoginForm($);
  if (loginForm.length === 0) throw new Error(`${label}: на странице входа нет формы входа`);

  const form = readForm($, loginForm, step.url);
  const loginField = loginForm.find('input[type="text"], input[type="email"], input:not([type])');
  const passwordField = loginForm.find('input[type="password"]');
  form.fields[loginField.attr('name') ?? 'login'] = credentials.username;
  form.fields[passwordField.attr('name') ?? 'password'] = credentials.password;

  const altcha = loginForm.find('altcha-widget');
  if (altcha.length > 0) {
    const challengeUrl = new URL(altcha.attr('challengeurl') ?? '', step.url).toString();
    const challengeRes = await session.send('GET', challengeUrl, {
      referer: step.url,
      accept: 'application/json',
    });
    const solution = await solveAltcha(JSON.parse(challengeRes.body) as AltchaChallenge);
    if (!solution) throw new Error(`${label}: не удалось решить ALTCHA`);
    form.fields[altcha.attr('name') ?? 'altcha'] = solution;
  }

  return session.finish(await session.submit(form, step.url), findLoginForm);
};

/**
 * Продолжает вход, остановленный на коде из письма: отправляет код в сохранённую форму и
 * доводит вход до токенов. null — сайт не принял код и показал форму снова. Бросает, если вместо
 * этого вернулась форма входа: начатый вход истёк, начинать надо с пароля.
 */
export const confirmLibSocialLogin = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  pending: LibSocialPendingLogin,
  code: string,
  label: string,
  http: LoginHttp = undiciLoginHttp,
): Promise<LibSocialTokenState | null> => {
  const authorization = createLibSocialAuthorization(auth, siteId, label, pending.pkce);
  const jar = CookieJar.deserializeSync(pending.cookies);
  const session = createLoginSession(authorization, jar, label, http);

  const form = { ...pending.form, fields: { ...pending.form.fields, [pending.codeField]: code } };
  const step = await session.submit(form, pending.url);
  if ('page' in step && findLoginForm(load(step.page)).length > 0) {
    throw new Error(`${label}: вход по коду истёк — сайт вернул форму входа`);
  }
  const result = await session.finish(step, findCodeForm);
  if (result && 'pending' in result) {
    throw new Error(`${label}: сайт снова запросил код после подтверждения`);
  }
  return result?.tokens ?? null;
};
