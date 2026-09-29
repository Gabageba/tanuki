import { AsyncLocalStorage } from 'node:async_hooks';
import type { CookieJar } from 'tough-cookie';
import type { SourceAuthFamily } from '@tanuki/contracts';
import type { GroupleCredentials } from './parser';

/** Где лежит OAuth-токен одного аккаунта LibSocial — файл сервисной учётки или память сервера. */
export type LibSocialTokenState = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms — derived from the token response's expires_in at the time it was fetched. */
  expiresAt: number;
};

export type TokenStore = {
  /** Ключ, по которому склеиваются одновременные refresh одного и того же токена. */
  readonly key: string;
  read(): Promise<LibSocialTokenState | null>;
  write(state: LibSocialTokenState): Promise<void>;
  /** Сохранённые логин и пароль — чтобы войти заново, когда refresh_token отвергнут. */
  readonly credentials?: GroupleCredentials;
};

/**
 * Аккаунт пользователя на семействе источников, от имени которого идут запросы. Для Grouple и
 * AllHentai это свой cookie jar с сессией SSO (и, если человек разрешил, пароль для повторного
 * входа), для LibSocial — токены по каждому источнику сети.
 */
export type SourceAccountSession = {
  jar?: CookieJar;
  credentials?: GroupleCredentials;
  tokenStore?(sourceId: string): TokenStore | null;
  /** Сессия обновилась (новые cookie, повернулся токен) — хозяину пора её сохранить. */
  onChange?(): void;
};

export type SourceAccountScope = Partial<Record<SourceAuthFamily, SourceAccountSession>>;

const storage = new AsyncLocalStorage<SourceAccountScope>();

/**
 * Выполняет fn от имени аккаунтов из scope. Без scope (фоновые задачи, пробник) запросы идут
 * как раньше — через общий jar и сервисную учётку из env.
 */
export const runWithSourceAccounts = <T>(scope: SourceAccountScope, fn: () => Promise<T>) =>
  storage.run(scope, fn);

/** Аккаунт семейства в текущем запросе; undefined — запрос идёт не от пользователя. */
export const currentSourceAccount = (
  family: SourceAuthFamily | null | undefined,
): SourceAccountSession | undefined => (family ? storage.getStore()?.[family] : undefined);
