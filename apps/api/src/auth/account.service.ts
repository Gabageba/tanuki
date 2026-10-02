import { randomInt, randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm';
import { EMAIL_CHANGE_CODE_LENGTH, type CurrentUser, type Language } from '@tanuki/contracts';
import {
  ApiException,
  BadRequestApiException,
  CodeInvalidException,
  EmailTakenException,
  StorageUnavailableException,
  TokenInvalidException,
  WrongPasswordException,
} from '../common/errors';
import { generateToken, hashToken, isSameHash } from '../common/token.util';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { getUniqueViolation } from '../database/pg-error.util';
import { emailTokens, users } from '../database/schema';
import { MailService } from '../mail/mail.service';
import { RATE_LIMIT } from '../rate-limit/models';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { assertNotBlocked, toCurrentUser } from '../users/users.util';
import type { AuthResult } from './auth.service';
import { hashEmailCode, maskEmail, normalizeEmail } from './email.util';
import {
  ACCOUNT_DELETION_GRACE_MS,
  EMAIL_CHANGE_CODE_TTL_MS,
  EMAIL_CHANGE_REVERT_TTL_MS,
  EMAIL_CODE_RESULT,
  EMAIL_TOKEN_PURPOSE,
  MAX_EMAIL_CODE_ATTEMPTS,
  type EmailCodeResult,
  type EmailTokenPurpose,
} from './models';
import { PasswordService } from './password.service';
import { SessionService, type SessionMeta, type SessionUser } from './session.service';

type Transaction = Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0];

const formatEmailDate = (date: Date, language: Language): string =>
  new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  );

/**
 * Действия владельца над своим аккаунтом: смена почты и пароля, удаление. Всё, что меняет
 * способ входа, требует текущий пароль — сессии в чужом браузере для этого недостаточно.
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Почта меняется в два шага внутри одной модалки: сначала на новый адрес уходит код, потом
   * человек вводит его — и почта сразу меняется. До ввода кода у аккаунта одна, прежняя почта:
   * ожидающий адрес живёт только в payload кода. Повторный запрос гасит прежний код.
   */
  async requestEmailChange(user: SessionUser, newEmail: string, password: string): Promise<void> {
    await this.assertPassword(user, password);

    const email = normalizeEmail(newEmail);
    if (email === user.email) throw new BadRequestApiException();
    if (await this.isEmailTaken(email)) throw new EmailTakenException();
    // Лимит писем — только после пароля: опечатка в нём не должна запирать отправку на минуту.
    await this.consumeEmailLimits(user.id);

    const id = randomUUID();
    const code = randomInt(0, 10 ** EMAIL_CHANGE_CODE_LENGTH)
      .toString()
      .padStart(EMAIL_CHANGE_CODE_LENGTH, '0');
    try {
      await this.database.db.transaction(async (tx) => {
        await this.consumeTokens(tx, user.id, [EMAIL_TOKEN_PURPOSE.CHANGE_EMAIL]);
        await tx.insert(emailTokens).values({
          id,
          userId: user.id,
          purpose: EMAIL_TOKEN_PURPOSE.CHANGE_EMAIL,
          tokenHash: hashEmailCode(id, code),
          payload: email,
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_CODE_TTL_MS),
        });
      });
    } catch {
      throw new StorageUnavailableException();
    }

    await this.trySend('с кодом смены почты', email, () =>
      this.mailService.sendEmailChangeCode(email, user.language, code),
    );
  }

  /**
   * Код из письма на новый адрес. Применяет смену и шлёт на прежний адрес уведомление со ссылкой
   * «это был не я» — так человек, узнавший пароль, не уведёт аккаунт тихо.
   */
  async confirmEmailChange(user: SessionUser, code: string): Promise<CurrentUser> {
    const revertToken = generateToken();
    let result: EmailCodeResult;
    try {
      result = await this.database.db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(emailTokens)
          .where(
            and(
              eq(emailTokens.userId, user.id),
              eq(emailTokens.purpose, EMAIL_TOKEN_PURPOSE.CHANGE_EMAIL),
              isNull(emailTokens.usedAt),
              gt(emailTokens.expiresAt, new Date()),
            ),
          )
          .orderBy(desc(emailTokens.createdAt))
          .limit(1)
          .for('update');
        if (!row?.payload) return { status: EMAIL_CODE_RESULT.EXPIRED };

        // Неверный ввод не бросает, а возвращается: счётчик попыток должен пережить транзакцию.
        if (!isSameHash(row.tokenHash, hashEmailCode(row.id, code))) {
          const attempts = row.attempts + 1;
          const burned = attempts >= MAX_EMAIL_CODE_ATTEMPTS;
          await tx
            .update(emailTokens)
            .set({ attempts, usedAt: burned ? new Date() : null })
            .where(eq(emailTokens.id, row.id));
          return { status: burned ? EMAIL_CODE_RESULT.EXPIRED : EMAIL_CODE_RESULT.WRONG };
        }

        await tx.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id));
        await tx.insert(emailTokens).values({
          userId: user.id,
          purpose: EMAIL_TOKEN_PURPOSE.REVERT_EMAIL_CHANGE,
          tokenHash: hashToken(revertToken),
          payload: user.email,
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_REVERT_TTL_MS),
        });
        const [updated] = await tx
          .update(users)
          .set({ email: row.payload, emailVerifiedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
        if (!updated) throw new StorageUnavailableException();
        return { status: EMAIL_CODE_RESULT.APPLIED, user: updated };
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      if (getUniqueViolation(error) === 'users_email_lower_idx') throw new EmailTakenException();
      throw new StorageUnavailableException();
    }

    switch (result.status) {
      case EMAIL_CODE_RESULT.WRONG:
        throw new CodeInvalidException('wrongCode');
      case EMAIL_CODE_RESULT.EXPIRED:
        throw new CodeInvalidException('codeExpiredRequestNew');
      case EMAIL_CODE_RESULT.APPLIED:
        await this.trySend('о смене почты', user.email, () =>
          this.mailService.sendEmailChanged(
            user.email,
            user.language,
            maskEmail(result.user.email),
            this.appUrl('/revert-email-change', revertToken),
          ),
        );
        return toCurrentUser(result.user);
    }
  }

  /**
   * «Это был не я» из письма на прежний адрес. Возвращает почту из ссылки, гасит все ещё живые
   * коды смены и выкидывает все устройства — тот, кто менял почту, знал пароль.
   */
  async revertEmailChange(token: string): Promise<void> {
    let userId: string;
    try {
      userId = await this.database.db.transaction(async (tx) => {
        const row = await this.consumeToken(tx, token, EMAIL_TOKEN_PURPOSE.REVERT_EMAIL_CHANGE);
        if (!row.payload) throw new TokenInvalidException();

        await this.consumeTokens(tx, row.userId, [
          EMAIL_TOKEN_PURPOSE.CHANGE_EMAIL,
          EMAIL_TOKEN_PURPOSE.REVERT_EMAIL_CHANGE,
        ]);
        await tx
          .update(users)
          .set({ email: row.payload, emailVerifiedAt: new Date() })
          .where(eq(users.id, row.userId));
        return row.userId;
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      if (getUniqueViolation(error) === 'users_email_lower_idx') throw new EmailTakenException();
      throw new StorageUnavailableException();
    }

    await this.sessionService.revokeAllForUser(userId);
  }

  async changePassword(
    user: SessionUser,
    currentSessionId: string,
    currentPassword: string,
    newPassword: string,
    signOutOtherDevices: boolean,
  ): Promise<void> {
    await this.assertPassword(user, currentPassword);
    const passwordHash = await this.passwordService.hash(newPassword);

    try {
      await this.database.db.transaction(async (tx) => {
        await tx.update(users).set({ passwordHash }).where(eq(users.id, user.id));
        // Ссылка сброса, запрошенная до смены, иначе задала бы пароль поверх нового.
        await this.consumeTokens(tx, user.id, [EMAIL_TOKEN_PURPOSE.RESET_PASSWORD]);
      });
    } catch {
      throw new StorageUnavailableException();
    }

    if (signOutOtherDevices) {
      await this.sessionService.revokeAllExcept(user.id, currentSessionId);
    }
  }

  /**
   * Аккаунт не удаляется сразу: ставится дата, все устройства выходят, а на почту уходит ссылка
   * отмены. Окончательно строку удаляет крон (AuthCleanupService) по наступлении даты.
   */
  async scheduleDeletion(user: SessionUser, password: string): Promise<void> {
    await this.assertPassword(user, password);

    const deletionAt = new Date(Date.now() + ACCOUNT_DELETION_GRACE_MS);
    const token = generateToken();
    try {
      await this.database.db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ deletionScheduledAt: deletionAt })
          .where(eq(users.id, user.id));
        await this.consumeTokens(tx, user.id, [EMAIL_TOKEN_PURPOSE.CANCEL_ACCOUNT_DELETION]);
        await tx.insert(emailTokens).values({
          userId: user.id,
          purpose: EMAIL_TOKEN_PURPOSE.CANCEL_ACCOUNT_DELETION,
          tokenHash: hashToken(token),
          expiresAt: deletionAt,
        });
      });
    } catch {
      throw new StorageUnavailableException();
    }

    await this.sessionService.revokeAllForUser(user.id);
    await this.trySend('о запланированном удалении', user.email, () =>
      this.mailService.sendAccountDeletionScheduled(
        user.email,
        user.language,
        formatEmailDate(deletionAt, user.language),
        this.appUrl('/cancel-account-deletion', token),
      ),
    );
  }

  /** Ссылка отмены из письма — снимает удаление и сразу логинит, как подтверждение почты. */
  async cancelDeletion(token: string, meta: SessionMeta): Promise<AuthResult> {
    let user: SessionUser;
    try {
      user = await this.database.db.transaction(async (tx) => {
        const row = await this.consumeToken(tx, token, EMAIL_TOKEN_PURPOSE.CANCEL_ACCOUNT_DELETION);
        const [updated] = await tx
          .update(users)
          .set({ deletionScheduledAt: null })
          .where(eq(users.id, row.userId))
          .returning();
        if (!updated) throw new TokenInvalidException();
        return updated;
      });
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }

    // Удаление отменено в любом случае, но войти заблокированный всё равно не может.
    assertNotBlocked(user);
    const session = await this.sessionService.create(user.id, false, meta);
    return { user: toCurrentUser(user), token: session.token, remember: session.remember };
  }

  /** На пользователя, а не на адрес: иначе новые адреса обходили бы лимит по одному. */
  private async consumeEmailLimits(userId: string): Promise<void> {
    await this.rateLimit.consume(
      `email-short:user:${userId}`,
      RATE_LIMIT.EMAIL_SHORT.limit,
      RATE_LIMIT.EMAIL_SHORT.windowSeconds,
    );
    await this.rateLimit.consume(
      `email-hourly:user:${userId}`,
      RATE_LIMIT.EMAIL_HOURLY.limit,
      RATE_LIMIT.EMAIL_HOURLY.windowSeconds,
    );
  }

  private async assertPassword(user: SessionUser, password: string): Promise<void> {
    if (!(await this.passwordService.verify(password, user.passwordHash))) {
      throw new WrongPasswordException();
    }
  }

  private async isEmailTaken(email: string): Promise<boolean> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row !== undefined;
    }, false);
  }

  /** Находит живую ссылку и гасит её — повторный переход по той же ссылке уже не сработает. */
  private async consumeToken(tx: Transaction, token: string, purpose: EmailTokenPurpose) {
    const [row] = await tx
      .update(emailTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(emailTokens.tokenHash, hashToken(token)),
          eq(emailTokens.purpose, purpose),
          isNull(emailTokens.usedAt),
          gt(emailTokens.expiresAt, new Date()),
        ),
      )
      .returning();
    if (!row) throw new TokenInvalidException();
    return row;
  }

  private async consumeTokens(
    tx: Transaction,
    userId: string,
    purposes: EmailTokenPurpose[],
  ): Promise<void> {
    await tx
      .update(emailTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(emailTokens.userId, userId),
          inArray(emailTokens.purpose, purposes),
          isNull(emailTokens.usedAt),
        ),
      );
  }

  /** Упавшая отправка не откатывает действие: запрос уже в базе, письмо можно запросить снова. */
  private async trySend(what: string, to: string, send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch (error) {
      this.logger.warn(`Не удалось отправить письмо ${what} на ${to}: ${(error as Error).message}`);
    }
  }

  private appUrl(path: string, token: string): string {
    return `${this.env.APP_URL}${path}?token=${token}`;
  }
}
