import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, ilike, isNull } from 'drizzle-orm';
import type { CurrentUser, Language, RegisterRequest } from '@tanuki/contracts';
import {
  AccountDeletionScheduledException,
  ApiException,
  EmailNotVerifiedException,
  EmailTakenException,
  InvalidCredentialsException,
  InviteInvalidException,
  StorageUnavailableException,
  TokenInvalidException,
  UsernameTakenException,
} from '../common/errors';
import { generateToken, hashToken } from '../common/token.util';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { getUniqueViolation } from '../database/pg-error.util';
import { emailTokens, invites, users } from '../database/schema';
import { MailService } from '../mail/mail.service';
import { assertNotBlocked, toCurrentUser } from '../users/users.util';
import { normalizeEmail } from './email.util';
import { EMAIL_TOKEN_PURPOSE, EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS } from './models';
import { PasswordService } from './password.service';
import { SessionService, type SessionMeta } from './session.service';

export type AuthResult = {
  user: CurrentUser;
  token: string;
  remember: boolean;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Инвайт проверяется и сгорает в той же транзакции, что и создание пользователя: если
   * учётку создать не удалось (например, гонка за один и тот же email), инвайт остаётся
   * активным. Уникальность email/username в итоге гарантирует не предварительная проверка
   * (та не защищает от гонки), а индексы БД — их нарушение здесь превращается в понятную ошибку.
   */
  async register(input: RegisterRequest): Promise<void> {
    const email = normalizeEmail(input.email);
    const passwordHash = await this.passwordService.hash(input.password);

    let userId: string;
    try {
      userId = await this.database.db.transaction(async (tx) => {
        const [invite] = await tx
          .select()
          .from(invites)
          .where(
            and(
              eq(invites.codeHash, hashToken(input.inviteCode)),
              isNull(invites.usedAt),
              isNull(invites.revokedAt),
              gt(invites.expiresAt, new Date()),
            ),
          )
          .limit(1);
        if (!invite) throw new InviteInvalidException();

        const [user] = await tx
          .insert(users)
          .values({
            email,
            username: input.username,
            passwordHash,
            role: invite.role,
            language: input.language,
          })
          .returning({ id: users.id });
        if (!user) throw new StorageUnavailableException();

        const consumed = await tx
          .update(invites)
          .set({ usedBy: user.id, usedAt: new Date() })
          .where(and(eq(invites.id, invite.id), isNull(invites.usedAt), isNull(invites.revokedAt)))
          .returning({ id: invites.id });
        if (consumed.length === 0) throw new InviteInvalidException();

        return user.id;
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      const violatedIndex = getUniqueViolation(error);
      if (violatedIndex === 'users_email_lower_idx') throw new EmailTakenException();
      if (violatedIndex === 'users_username_lower_idx') throw new UsernameTakenException();
      throw new StorageUnavailableException();
    }

    await this.sendVerificationEmail(userId, email, input.language);
  }

  /** true — свободно. Инвайт валиден проверяется отдельно контроллером/сервисом инвайтов. */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(ilike(users.username, username))
        .limit(1);
      return row ?? null;
    }, null);
    return existing === null;
  }

  async verifyEmail(token: string, meta: SessionMeta): Promise<AuthResult> {
    const tokenHash = hashToken(token);

    let userId: string;
    try {
      userId = await this.database.db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(emailTokens)
          .where(
            and(
              eq(emailTokens.tokenHash, tokenHash),
              eq(emailTokens.purpose, EMAIL_TOKEN_PURPOSE.VERIFY_EMAIL),
              isNull(emailTokens.usedAt),
              gt(emailTokens.expiresAt, new Date()),
            ),
          )
          .limit(1);
        if (!row) throw new TokenInvalidException();

        const consumed = await tx
          .update(emailTokens)
          .set({ usedAt: new Date() })
          .where(and(eq(emailTokens.id, row.id), isNull(emailTokens.usedAt)))
          .returning({ id: emailTokens.id });
        if (consumed.length === 0) throw new TokenInvalidException();

        await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
        return row.userId;
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }

    return this.createSessionFor(userId, true, meta);
  }

  async resendVerification(email: string, language: Language): Promise<void> {
    const normalized = normalizeEmail(email);
    const user = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(users)
        .where(and(eq(users.email, normalized), isNull(users.emailVerifiedAt)))
        .limit(1);
      return row ?? null;
    }, null);

    // Молчим и при отсутствии аккаунта, и при уже подтверждённой почте — email не раскрывается.
    if (!user) return;

    await this.sendVerificationEmail(user.id, normalized, language);
  }

  async login(
    login: string,
    password: string,
    remember: boolean,
    cancelDeletion: boolean,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const normalized = normalizeEmail(login);
    const user = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.email, normalized))
        .limit(1);
      if (row) return row;

      const [byUsername] = await this.database.db
        .select()
        .from(users)
        .where(ilike(users.username, login))
        .limit(1);
      return byUsername ?? null;
    }, null);

    if (!user || !(await this.passwordService.verify(password, user.passwordHash))) {
      throw new InvalidCredentialsException();
    }
    if (!user.emailVerifiedAt) throw new EmailNotVerifiedException();
    // Тоже после пароля — иначе срок и причина блокировки уходили бы любому, кто знает логин.
    assertNotBlocked(user);

    // Проверяется после пароля: иначе ошибка выдавала бы, что аккаунт с таким логином есть.
    if (user.deletionScheduledAt) {
      if (!cancelDeletion) throw new AccountDeletionScheduledException();
      await this.cancelDeletion(user.id);
    }

    const session = await this.sessionService.create(user.id, remember, meta);
    return {
      user: toCurrentUser({ ...user, deletionScheduledAt: null }),
      token: session.token,
      remember: session.remember,
    };
  }

  /** Снимает запланированное удаление и гасит ссылку отмены из письма — она больше не нужна. */
  private async cancelDeletion(userId: string): Promise<void> {
    try {
      await this.database.db.transaction(async (tx) => {
        await tx.update(users).set({ deletionScheduledAt: null }).where(eq(users.id, userId));
        await tx
          .update(emailTokens)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(emailTokens.userId, userId),
              eq(emailTokens.purpose, EMAIL_TOKEN_PURPOSE.CANCEL_ACCOUNT_DELETION),
              isNull(emailTokens.usedAt),
            ),
          );
      });
    } catch {
      throw new StorageUnavailableException();
    }
  }

  async logout(token: string): Promise<void> {
    await this.sessionService.revoke(token);
  }

  async forgotPassword(email: string, language: Language): Promise<void> {
    const normalized = normalizeEmail(email);
    const user = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.email, normalized))
        .limit(1);
      return row ?? null;
    }, null);

    // Ответ одинаков независимо от того, найден аккаунт или нет — существование почты не палим.
    if (!user) return;

    const token = generateToken();
    const applied = await this.database.withFallback(async () => {
      await this.database.db.insert(emailTokens).values({
        userId: user.id,
        purpose: EMAIL_TOKEN_PURPOSE.RESET_PASSWORD,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
      return true;
    }, false);
    if (!applied) return;

    try {
      await this.mailService.sendResetPassword(normalized, language, this.resetPasswordUrl(token));
    } catch (error) {
      this.logger.warn(
        `Не удалось отправить письмо сброса пароля на ${normalized}: ${(error as Error).message}`,
      );
    }
  }

  async resetPassword(token: string, password: string, meta: SessionMeta): Promise<AuthResult> {
    const tokenHash = hashToken(token);
    const passwordHash = await this.passwordService.hash(password);

    let userId: string;
    try {
      userId = await this.database.db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(emailTokens)
          .where(
            and(
              eq(emailTokens.tokenHash, tokenHash),
              eq(emailTokens.purpose, EMAIL_TOKEN_PURPOSE.RESET_PASSWORD),
              isNull(emailTokens.usedAt),
              gt(emailTokens.expiresAt, new Date()),
            ),
          )
          .limit(1);
        if (!row) throw new TokenInvalidException();

        const consumed = await tx
          .update(emailTokens)
          .set({ usedAt: new Date() })
          .where(and(eq(emailTokens.id, row.id), isNull(emailTokens.usedAt)))
          .returning({ id: emailTokens.id });
        if (consumed.length === 0) throw new TokenInvalidException();

        // Сброс пароля по ссылке из почты — явное желание вернуться в аккаунт, поэтому
        // запланированное удаление тоже снимается: иначе новая сессия тут же отвергалась бы.
        await tx
          .update(users)
          .set({ passwordHash, deletionScheduledAt: null })
          .where(eq(users.id, row.userId));
        return row.userId;
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }

    // Сброс пароля — сигнал «эту учётку мог трогать кто-то ещё», поэтому все прежние сессии
    // отзываются, а не только эта.
    await this.sessionService.revokeAllForUser(userId);
    return this.createSessionFor(userId, false, meta);
  }

  private async createSessionFor(
    userId: string,
    remember: boolean,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const user = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return row ?? null;
    }, null);
    if (!user) throw new StorageUnavailableException();
    // Подтверждение почты и сброс пароля по ссылке не должны впускать заблокированного.
    assertNotBlocked(user);

    const session = await this.sessionService.create(user.id, remember, meta);
    return { user: toCurrentUser(user), token: session.token, remember: session.remember };
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
    language: Language,
  ): Promise<void> {
    const token = generateToken();
    const applied = await this.database.withFallback(async () => {
      await this.database.db.insert(emailTokens).values({
        userId,
        purpose: EMAIL_TOKEN_PURPOSE.VERIFY_EMAIL,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      });
      return true;
    }, false);
    if (!applied) throw new StorageUnavailableException();

    // Токен уже в базе, аккаунт уже создан (или уже существовал) — упавшая отправка не должна
    // превращать успешную регистрацию/resend в 500. Человек всё ещё может нажать «отправить
    // ещё раз», а вот откатывать транзакцию ради письма незачем.
    try {
      await this.mailService.sendVerifyEmail(email, language, this.verifyEmailUrl(token));
    } catch (error) {
      this.logger.warn(
        `Не удалось отправить письмо подтверждения на ${email}: ${(error as Error).message}`,
      );
    }
  }

  private verifyEmailUrl(token: string): string {
    return `${this.env.APP_URL}/verify-email?token=${token}`;
  }

  private resetPasswordUrl(token: string): string {
    return `${this.env.APP_URL}/reset-password?token=${token}`;
  }
}
