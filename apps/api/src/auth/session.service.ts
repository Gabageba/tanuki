import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, lt, ne } from 'drizzle-orm';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { sessions, users } from '../database/schema';
import { generateToken, hashToken } from '../common/token.util';
import { SESSION_IDLE_MS, SESSION_REMEMBER_MS, SESSION_TOUCH_INTERVAL_MS } from './models';

export type SessionUser = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;

export type ResolvedSession = {
  session: SessionRow;
  user: SessionUser;
};

export type SessionMeta = {
  userAgent?: string;
  ip?: string;
};

const expiryFor = (remember: boolean, from: number): Date =>
  new Date(from + (remember ? SESSION_REMEMBER_MS : SESSION_IDLE_MS));

@Injectable()
export class SessionService {
  constructor(private readonly database: DatabaseService) {}

  /** Создаёт сессию и возвращает токен в открытом виде — единственный момент, когда он виден. */
  async create(
    userId: string,
    remember: boolean,
    meta: SessionMeta,
  ): Promise<{ token: string; expiresAt: Date; remember: boolean }> {
    const token = generateToken();
    const expiresAt = expiryFor(remember, Date.now());

    const applied = await this.database.withFallback(async () => {
      await this.database.db.insert(sessions).values({
        userId,
        tokenHash: hashToken(token),
        remember,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
    return { token, expiresAt, remember };
  }

  /** null и при отсутствующей сессии, и при недоступной базе — гость есть гость. */
  async resolve(token: string): Promise<ResolvedSession | null> {
    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.tokenHash, hashToken(token)))
        .limit(1);

      const row = rows[0];
      if (!row || row.session.expiresAt.getTime() < Date.now()) return null;
      return row;
    }, null);
  }

  /**
   * Скользящее продление: если с последней записи прошло меньше часа, ничего не делает — иначе
   * каждый запрос авторизованного пользователя писал бы в БД. Возвращает новый срок для cookie
   * (только remember-сессии переставляют её Max-Age), либо null, если продлевать было рано.
   */
  async touch(session: SessionRow): Promise<Date | null> {
    const now = Date.now();
    if (now - session.lastSeenAt.getTime() < SESSION_TOUCH_INTERVAL_MS) return null;

    const expiresAt = expiryFor(session.remember, now);
    await this.database.withFallback(async () => {
      await this.database.db
        .update(sessions)
        .set({ expiresAt, lastSeenAt: new Date(now) })
        .where(eq(sessions.id, session.id));
      return true;
    }, false);

    return expiresAt;
  }

  async revoke(token: string): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
      return true;
    }, false);
  }

  /** Живые сессии пользователя, самые свежие первыми. */
  async listForUser(userId: string): Promise<SessionRow[]> {
    return this.database.withFallback(
      () =>
        this.database.db
          .select()
          .from(sessions)
          .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
          .orderBy(desc(sessions.lastSeenAt)),
      [],
    );
  }

  /** userId в условии не даёт завершить чужую сессию, подобрав её id. */
  async revokeById(userId: string, sessionId: string): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db
        .delete(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
      return true;
    }, false);
  }

  /** «Выйти на других устройствах» — все сессии, кроме той, с которой пришёл запрос. */
  async revokeAllExcept(userId: string, sessionId: string): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db
        .delete(sessions)
        .where(and(eq(sessions.userId, userId), ne(sessions.id, sessionId)));
      return true;
    }, false);
  }

  /** Все устройства сразу — сброс пароля, откат смены почты, удаление аккаунта. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db.delete(sessions).where(eq(sessions.userId, userId));
      return true;
    }, false);
  }

  async deleteExpired(): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
      return true;
    }, false);
  }
}
