import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  SOURCE_ACCESS,
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  SOURCE_LOGIN_REQUIREMENT,
  catalogEntryFor,
  isLibSocialAuthFamily,
  type Source,
  type SourceAccess,
  type SourceAuthFamily,
} from '@tanuki/contracts';
import {
  CookieJar,
  type LibSocialTokenState,
  type SourceAccountScope,
  type SourceAccountSession,
} from '@tanuki/parsers';
import {
  SourceAccountRequiredException,
  SourceLinkingUnavailableException,
  StorageUnavailableException,
} from '../common/errors';
import { decryptSecret, encryptSecret } from '../common/secret-box';
import { AdultContentService } from '../adult-content/adult-content.service';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { sourceAccounts } from '../database/schema';
import { SOURCE_SESSION_PERSIST_DELAY_MS, SOURCE_SESSIONS_CACHE_SIZE, VIEWER_KIND } from './models';
import { getViewer } from './viewer-context';
import { splitLibSocialAccount } from './libsocial-accounts';

export type SourceAccountRow = typeof sourceAccounts.$inferSelect;

/** Токен сайта LibSocial; у старых общих аккаунтов здесь могло быть несколько сайтов. */
export type LibSocialTokens = Partial<Record<string, LibSocialTokenState>>;

/** Что лежит в encrypted_state: jar Grouple/AllHentai или токены LibSocial. */
export type SourceAccountState =
  { cookies: NonNullable<ReturnType<CookieJar['serializeSync']>> } | { tokens: LibSocialTokens };

/** Что список источников знает о входе пользователя на источник. */
export type SourceLogin = Pick<Source, 'access' | 'loginRequirement' | 'isLoggedIn'>;

/**
 * Сессия зрителя без своего аккаунта на источнике с входом по желанию: запрос идёт анонимно, как
 * у гостя на самом сайте. Сервисная учётка ему не подставляется — она только для фоновых задач.
 */
const ANONYMOUS_SESSION: SourceAccountSession = {};

/** Идёт ли запрос от имени привязанного аккаунта, а не анонимно. */
export const hasSourceAccount = (scope: SourceAccountScope | undefined) =>
  Object.values(scope ?? {}).some((session) => session !== ANONYMOUS_SESSION);

type LiveAccount = {
  row: SourceAccountRow;
  session: SourceAccountSession;
  /** Текущие токены LibSocial — после поворота они новее, чем в строке БД. */
  tokens: LibSocialTokens;
  password: string | null;
};

/** Имя семейства INUKO до миграции 0032 — под ним зашифрованы уже привязанные аккаунты. */
const LEGACY_INUKO_AAD_FAMILY = 'inkstory';

/**
 * Ключ аккаунта в памяти и AAD его шифрования. Хвостовое `:` — след колонки source_id, которая
 * раньше входила в ключ: без него не расшифруются уже сохранённые аккаунты Grouple и AllHentai.
 * По той же причине семейство INUKO входит в AAD под старым именем.
 */
const accountKey = (userId: string, family: SourceAuthFamily) =>
  `${userId}:${family === SOURCE_AUTH_FAMILY.INUKO ? LEGACY_INUKO_AAD_FAMILY : family}:`;

/**
 * Личные аккаунты пользователей на источниках: хранение (зашифрованно), живые сессии в памяти
 * и решение, пускать ли запрос к источнику. Источник с обязательным входом (loginRequirement в
 * каталоге) без своего аккаунта закрыт даже для данных из общего кеша; остальные читаются и без
 * него — анонимно.
 */
@Injectable()
export class SourceAccessService {
  private readonly logger = new Logger(SourceAccessService.name);
  private readonly key: Buffer | null;
  /** Map держит порядок вставки — самый давний ключ вытесняется первым. */
  private readonly live = new Map<string, LiveAccount>();
  private readonly persistTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly database: DatabaseService,
    private readonly adultContent: AdultContentService,
    @Inject(ENV) env: Env,
  ) {
    this.key = env.SOURCE_SECRETS_KEY ? Buffer.from(env.SOURCE_SECRETS_KEY, 'base64') : null;
  }

  get isLinkingAvailable(): boolean {
    return this.key !== null;
  }

  /**
   * Scope аккаунтов для запроса текущего зрителя к источнику. undefined — источник без входа или
   * фоновая работа (она ходит через сервисную учётку). Зритель ходит либо со своим аккаунтом,
   * либо, если вход по желанию, анонимно — через сервисную учётку никогда. Бросает
   * SourceAccountRequiredException, если источник закрыт, — до чтения кеша, иначе закрытый
   * источник читался бы из общего кеша. По той же причине здесь же отсекается источник 18+,
   * скрытый настройками зрителя.
   */
  async resolveScope(sourceId: string): Promise<SourceAccountScope | undefined> {
    await this.adultContent.assertSourceVisible(sourceId);

    const { authFamily: family, loginRequirement } = catalogEntryFor(sourceId);
    if (!family) return undefined;

    const viewer = getViewer();
    if (viewer.kind === VIEWER_KIND.SERVICE) return undefined;

    const isRequired = loginRequirement === SOURCE_LOGIN_REQUIREMENT.REQUIRED;
    if (viewer.kind === VIEWER_KIND.GUEST) {
      if (isRequired) throw new SourceAccountRequiredException(sourceId);
      return { [family]: ANONYMOUS_SESSION };
    }

    const account = await this.loadLive(viewer.userId, family);
    if (account && this.accessOf(account, sourceId) === SOURCE_ACCESS.AVAILABLE) {
      return { [family]: account.session };
    }
    if (isRequired) {
      const isReloginRequired = account?.row.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED;
      throw new SourceAccountRequiredException(sourceId, isReloginRequired);
    }
    return { [family]: ANONYMOUS_SESSION };
  }

  /**
   * Состояние входа на каждом источнике для списка источников — одним запросом в БД на
   * пользователя. Источник с входом по желанию не закрывается никогда.
   */
  async getLoginResolver(userId: string | undefined): Promise<(sourceId: string) => SourceLogin> {
    const accounts = new Map<SourceAuthFamily, LiveAccount>();
    if (userId) {
      for (const row of await this.listRows(userId)) {
        const account = await this.loadLive(userId, row.family, row);
        if (account) accounts.set(row.family, account);
      }
    }

    return (sourceId) => {
      const { authFamily: family, loginRequirement } = catalogEntryFor(sourceId);
      if (!family) return { access: SOURCE_ACCESS.AVAILABLE, loginRequirement, isLoggedIn: false };

      const account = accounts.get(family);
      const access = account ? this.accessOf(account, sourceId) : SOURCE_ACCESS.LOCKED;
      return {
        access:
          loginRequirement === SOURCE_LOGIN_REQUIREMENT.REQUIRED ? access : SOURCE_ACCESS.AVAILABLE,
        loginRequirement,
        isLoggedIn: access === SOURCE_ACCESS.AVAILABLE,
      };
    };
  }

  async listRows(userId: string): Promise<SourceAccountRow[]> {
    return this.database.withFallback(async () => {
      await this.migrateLibSocialAccounts(userId);
      return this.database.db
        .select()
        .from(sourceAccounts)
        .where(eq(sourceAccounts.userId, userId));
    }, []);
  }

  /**
   * Токены аккаунта LibSocial по сайтам и сохранённый пароль — из живой сессии: там токены
   * свежее, чем в строке БД.
   */
  async getLibSocialSecrets(
    userId: string,
    row: SourceAccountRow,
  ): Promise<{ tokens: LibSocialTokens; password: string | null }> {
    const account = await this.loadLive(userId, row.family, row);
    return { tokens: account?.tokens ?? {}, password: account?.password ?? null };
  }

  /** Сохраняет только что привязанный аккаунт и сбрасывает его старую живую сессию. */
  async save(
    userId: string,
    family: SourceAuthFamily,
    input: { login: string | null; password: string | null; state: SourceAccountState },
  ): Promise<void> {
    const key = this.requireKey();
    const aad = accountKey(userId, family);
    const values = {
      status: SOURCE_ACCOUNT_STATUS.ACTIVE,
      login: input.login,
      encryptedPassword: input.password
        ? encryptSecret(key, input.password, `${aad}:password`)
        : null,
      encryptedState: encryptSecret(key, JSON.stringify(input.state), `${aad}:state`),
      linkedAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (isLibSocialAuthFamily(family)) await this.migrateLibSocialAccounts(userId);
      await this.database.db
        .insert(sourceAccounts)
        .values({ userId, family, ...values })
        .onConflictDoUpdate({
          target: [sourceAccounts.userId, sourceAccounts.family],
          set: values,
        });
    } catch {
      throw new StorageUnavailableException();
    }
    this.evict(aad);
  }

  async remove(userId: string, family: SourceAuthFamily): Promise<void> {
    try {
      if (isLibSocialAuthFamily(family)) await this.migrateLibSocialAccounts(userId);
      await this.database.db.delete(sourceAccounts).where(this.whereAccount(userId, family));
    } catch {
      throw new StorageUnavailableException();
    }
    this.evict(accountKey(userId, family));
  }

  /**
   * Сессия аккаунта больше не принимается источником. Аккаунт остаётся привязанным, но источник
   * закрывается до повторного входа — так человек видит, что именно нужно сделать.
   * MangaLib и HentaiLib независимы: меняется только аккаунт выбранного сайта.
   */
  async markReloginRequired(userId: string, sourceId: string): Promise<void> {
    const family = catalogEntryFor(sourceId).authFamily;
    if (!family) return;

    await this.markFamilyReloginRequired(userId, family);
  }

  private accessOf(account: LiveAccount, sourceId: string): SourceAccess {
    if (account.row.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED) {
      return SOURCE_ACCESS.RELOGIN_REQUIRED;
    }
    if (isLibSocialAuthFamily(account.row.family) && !account.tokens[sourceId]) {
      return SOURCE_ACCESS.LOCKED;
    }
    return SOURCE_ACCESS.AVAILABLE;
  }

  private async markFamilyReloginRequired(userId: string, family: SourceAuthFamily) {
    this.logger.warn(`Сессия аккаунта ${family} пользователя ${userId} больше не действует`);
    await this.database.withFallback(async () => {
      await this.database.db
        .update(sourceAccounts)
        .set({ status: SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED, updatedAt: new Date() })
        .where(this.whereAccount(userId, family));
      return true;
    }, false);
    this.evict(accountKey(userId, family));
  }

  /** row — уже прочитанная строка аккаунта, чтобы не читать её из БД второй раз. */
  private async loadLive(
    userId: string,
    family: SourceAuthFamily,
    row?: SourceAccountRow,
  ): Promise<LiveAccount | null> {
    const key = accountKey(userId, family);
    const cached = this.live.get(key);
    if (cached) {
      // Переставляем в конец — свежеиспользованная сессия вытесняется последней.
      this.live.delete(key);
      this.live.set(key, cached);
      return cached;
    }

    const found =
      row ??
      (await this.database.withFallback(async () => {
        if (isLibSocialAuthFamily(family)) await this.migrateLibSocialAccounts(userId);
        const [first] = await this.database.db
          .select()
          .from(sourceAccounts)
          .where(this.whereAccount(userId, family))
          .limit(1);
        return first ?? null;
      }, null));
    if (!found || !this.key) return null;

    let account: LiveAccount;
    try {
      account = this.restore(found, key);
    } catch (error) {
      // Ключ сменили или строку испортили — для человека это то же, что протухшая сессия.
      this.logger.warn(`Не удалось расшифровать аккаунт ${key}: ${(error as Error).message}`);
      await this.markFamilyReloginRequired(userId, family);
      return null;
    }

    this.live.set(key, account);
    if (this.live.size > SOURCE_SESSIONS_CACHE_SIZE) {
      const [oldestKey, oldest] = this.live.entries().next().value ?? [];
      if (oldestKey && oldest) {
        // Вытесняемая сессия могла обновиться — сохраняем, прежде чем забыть.
        if (this.persistTimers.has(oldestKey)) void this.persist(oldestKey, oldest);
        this.evict(oldestKey);
      }
    }
    return account;
  }

  private restore(row: SourceAccountRow, key: string): LiveAccount {
    const secretKey = this.requireKey();
    const state = JSON.parse(
      decryptSecret(secretKey, row.encryptedState, `${key}:state`),
    ) as SourceAccountState;
    const password = row.encryptedPassword
      ? decryptSecret(secretKey, row.encryptedPassword, `${key}:password`)
      : null;
    const credentials = password && row.login ? { username: row.login, password } : undefined;

    const account: LiveAccount = { row, session: {}, tokens: {}, password };
    const onChange = () => this.schedulePersist(key, account);

    if ('cookies' in state) {
      account.session = {
        jar: CookieJar.deserializeSync(state.cookies),
        credentials,
        onChange,
      };
      return account;
    }

    account.tokens = state.tokens;
    account.session = {
      tokenStore: (sourceId) =>
        account.tokens[sourceId]
          ? {
              key: `${key}:${sourceId}`,
              credentials,
              read: () => Promise.resolve(account.tokens[sourceId] ?? null),
              write: (next) => {
                account.tokens[sourceId] = next;
                onChange();
                return Promise.resolve();
              },
            }
          : null,
      onChange,
    };
    return account;
  }

  /** Cookie и токены меняются пачками — пишем в БД не на каждое изменение, а раз в пару секунд. */
  private schedulePersist(key: string, account: LiveAccount): void {
    if (this.persistTimers.has(key)) return;
    this.persistTimers.set(
      key,
      setTimeout(() => {
        this.persistTimers.delete(key);
        void this.persist(key, account);
      }, SOURCE_SESSION_PERSIST_DELAY_MS),
    );
  }

  private async persist(key: string, account: LiveAccount): Promise<void> {
    if (!this.key) return;
    const { session, row, tokens } = account;
    const cookies = session.jar?.serializeSync();
    const state: SourceAccountState | null = isLibSocialAuthFamily(row.family)
      ? { tokens }
      : cookies
        ? { cookies }
        : null;
    if (!state) return;

    await this.database.withFallback(async () => {
      await this.database.db
        .update(sourceAccounts)
        .set({
          encryptedState: encryptSecret(this.requireKey(), JSON.stringify(state), `${key}:state`),
          updatedAt: new Date(),
        })
        .where(this.whereAccount(row.userId, row.family));
      return true;
    }, false);
  }

  /** Старую строку блокируем до конца переноса: параллельный вход/отвязка не воскресит токены. */
  private async migrateLibSocialAccounts(userId: string): Promise<void> {
    if (!this.key) return;
    const secretKey = this.key;
    await this.database.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(sourceAccounts)
        .where(this.whereAccount(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL))
        .for('update');
      if (!row) return;
      let split;
      try {
        split = splitLibSocialAccount(row, secretKey);
      } catch (error) {
        this.logger.warn(
          `Не удалось разделить аккаунт LibSocial пользователя ${userId}: ${(error as Error).message}`,
        );
        return;
      }
      const { accounts, legacy } = split;
      if (!accounts.length) return;
      // Новый самостоятельный вход имеет приоритет перед старой общей привязкой.
      await tx.insert(sourceAccounts).values(accounts).onConflictDoNothing();
      if (legacy) {
        await tx
          .update(sourceAccounts)
          .set({ encryptedState: legacy.encryptedState })
          .where(this.whereAccount(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL));
      } else {
        await tx
          .delete(sourceAccounts)
          .where(this.whereAccount(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL));
      }
      this.evict(accountKey(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL));
    });
  }

  private evict(key: string): void {
    clearTimeout(this.persistTimers.get(key));
    this.persistTimers.delete(key);
    this.live.delete(key);
  }

  private whereAccount(userId: string, family: SourceAuthFamily) {
    return and(eq(sourceAccounts.userId, userId), eq(sourceAccounts.family, family));
  }

  private requireKey(): Buffer {
    if (!this.key) throw new SourceLinkingUnavailableException();
    return this.key;
  }
}
