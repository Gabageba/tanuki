import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  SOURCE_ACCESS,
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  catalogEntryFor,
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
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { sourceAccounts } from '../database/schema';
import { SOURCE_SESSION_PERSIST_DELAY_MS, SOURCE_SESSIONS_CACHE_SIZE, VIEWER_KIND } from './models';
import { getViewer } from './viewer-context';

export type SourceAccountRow = typeof sourceAccounts.$inferSelect;

/** Токены LibSocial по сайтам сети: учётка одна, а токен каждый сайт выдаёт свой. */
export type LibSocialTokens = Partial<Record<string, LibSocialTokenState>>;

/** Что лежит в encrypted_state: jar Grouple/AllHentai или токены LibSocial. */
export type SourceAccountState =
  { cookies: NonNullable<ReturnType<CookieJar['serializeSync']>> } | { tokens: LibSocialTokens };

type LiveAccount = {
  row: SourceAccountRow;
  session: SourceAccountSession;
  /** Текущие токены LibSocial — после поворота они новее, чем в строке БД. */
  tokens: LibSocialTokens;
  password: string | null;
};

/**
 * Ключ аккаунта в памяти и AAD его шифрования. Хвостовое `:` — след колонки source_id, которая
 * раньше входила в ключ: без него не расшифруются уже сохранённые аккаунты Grouple и AllHentai.
 */
const accountKey = (userId: string, family: SourceAuthFamily) => `${userId}:${family}:`;

/**
 * Личные аккаунты пользователей на источниках: хранение (зашифрованно), живые сессии в памяти
 * и решение, пускать ли запрос к источнику. Запрос пользователя к источнику с входом идёт
 * только через его аккаунт — без аккаунта источник закрыт даже для данных из общего кеша.
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
    @Inject(ENV) private readonly env: Env,
  ) {
    this.key = env.SOURCE_SECRETS_KEY ? Buffer.from(env.SOURCE_SECRETS_KEY, 'base64') : null;
  }

  get isLinkingAvailable(): boolean {
    return this.key !== null;
  }

  /**
   * Scope аккаунтов для запроса текущего зрителя к источнику. undefined — запрос идёт как
   * раньше (источник без входа, фоновая работа или закрытие выключено). Бросает
   * SourceAccountRequiredException, если источник закрыт, — до чтения кеша, иначе закрытый
   * источник читался бы из общего кеша.
   */
  async resolveScope(sourceId: string): Promise<SourceAccountScope | undefined> {
    const family = catalogEntryFor(sourceId).authFamily;
    if (!family || !this.env.SOURCE_ACCOUNTS_REQUIRED) return undefined;

    const viewer = getViewer();
    if (viewer.kind === VIEWER_KIND.SERVICE) return undefined;
    if (viewer.kind === VIEWER_KIND.GUEST) throw new SourceAccountRequiredException(sourceId);

    const account = await this.loadLive(viewer.userId, family);
    if (!account || this.accessOf(account, sourceId) !== SOURCE_ACCESS.AVAILABLE) {
      throw new SourceAccountRequiredException(sourceId);
    }
    return { [family]: account.session };
  }

  /** Доступ к каждому источнику для списка источников — одним запросом в БД на пользователя. */
  async getAccessResolver(userId: string | undefined): Promise<(sourceId: string) => SourceAccess> {
    if (!this.env.SOURCE_ACCOUNTS_REQUIRED) return () => SOURCE_ACCESS.AVAILABLE;

    const accounts = new Map<SourceAuthFamily, LiveAccount>();
    if (userId) {
      for (const row of await this.listRows(userId)) {
        const account = await this.loadLive(userId, row.family, row);
        if (account) accounts.set(row.family, account);
      }
    }

    return (sourceId) => {
      const family = catalogEntryFor(sourceId).authFamily;
      if (!family) return SOURCE_ACCESS.AVAILABLE;
      const account = accounts.get(family);
      return account ? this.accessOf(account, sourceId) : SOURCE_ACCESS.LOCKED;
    };
  }

  async listRows(userId: string): Promise<SourceAccountRow[]> {
    return this.database.withFallback(
      () => this.database.db.select().from(sourceAccounts).where(eq(sourceAccounts.userId, userId)),
      [],
    );
  }

  /**
   * Токены аккаунта LibSocial по сайтам и сохранённый пароль — из живой сессии: там токены
   * свежее, чем в строке БД.
   */
  async getLibSocialSecrets(
    userId: string,
    row?: SourceAccountRow,
  ): Promise<{ tokens: LibSocialTokens; password: string | null }> {
    const account = await this.loadLive(userId, SOURCE_AUTH_FAMILY.LIBSOCIAL, row);
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
      await this.database.db.delete(sourceAccounts).where(this.whereAccount(userId, family));
    } catch {
      throw new StorageUnavailableException();
    }
    this.evict(accountKey(userId, family));
  }

  /**
   * Сессия аккаунта больше не принимается источником. Аккаунт остаётся привязанным, но источник
   * закрывается до повторного входа — так человек видит, что именно нужно сделать. У LibSocial
   * отвергнут токен одного сайта: забываем только его, остальные сайты сети продолжают работать.
   */
  async markReloginRequired(userId: string, sourceId: string): Promise<void> {
    const family = catalogEntryFor(sourceId).authFamily;
    if (!family) return;

    if (family === SOURCE_AUTH_FAMILY.LIBSOCIAL) {
      const account = await this.loadLive(userId, family);
      const hasOtherTokens = Object.keys(account?.tokens ?? {}).some((id) => id !== sourceId);
      if (account && hasOtherTokens) {
        this.logger.warn(`Токен ${sourceId} пользователя ${userId} больше не действует`);
        delete account.tokens[sourceId];
        await this.persist(accountKey(userId, family), account);
        return;
      }
    }

    await this.markFamilyReloginRequired(userId, family);
  }

  private accessOf(account: LiveAccount, sourceId: string): SourceAccess {
    if (account.row.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED) {
      return SOURCE_ACCESS.RELOGIN_REQUIRED;
    }
    if (account.row.family === SOURCE_AUTH_FAMILY.LIBSOCIAL && !account.tokens[sourceId]) {
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
    const state: SourceAccountState | null =
      row.family === SOURCE_AUTH_FAMILY.LIBSOCIAL ? { tokens } : cookies ? { cookies } : null;
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
