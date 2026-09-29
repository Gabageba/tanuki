import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { emailTokens, invites, users } from '../database/schema';
import { UNVERIFIED_ACCOUNT_TTL_MS } from './models';
import { SessionService } from './session.service';

/**
 * Ежедневная уборка: неподтверждённые аккаунты (человек так и не перешёл по ссылке) и всё, что
 * от них зависит. Инвайт таких аккаунтов освобождается, а не остаётся «использованным» навсегда
 * — usedBy/usedAt сбрасываются раньше удаления пользователя (иначе внешний ключ уже унёс бы
 * usedBy в null сам, но usedAt остался бы стоять).
 */
@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly sessionService: SessionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanup(): Promise<void> {
    await this.releaseExpiredUnverifiedAccounts();
    await this.deleteScheduledAccounts();
    await this.sessionService.deleteExpired();
    await this.deleteExpiredEmailTokens();
  }

  private async releaseExpiredUnverifiedAccounts(): Promise<void> {
    const cutoff = new Date(Date.now() - UNVERIFIED_ACCOUNT_TTL_MS);

    await this.database.withFallback(async () => {
      const stale = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(and(isNull(users.emailVerifiedAt), lt(users.createdAt, cutoff)));

      for (const { id } of stale) {
        await this.database.db
          .update(invites)
          .set({ usedBy: null, usedAt: null })
          .where(eq(invites.usedBy, id));
        await this.database.db.delete(users).where(eq(users.id, id));
      }

      if (stale.length > 0) {
        this.logger.log(`Удалено неподтверждённых аккаунтов: ${stale.length}`);
      }
      return true;
    }, false);
  }

  /**
   * Окончательное удаление аккаунтов, чей срок отмены истёк. Всё, что принадлежит пользователю,
   * уходит каскадом внешних ключей; инвайты, которые он создал или использовал, остаются, но
   * теряют ссылку на него (on delete set null).
   */
  private async deleteScheduledAccounts(): Promise<void> {
    await this.database.withFallback(async () => {
      const deleted = await this.database.db
        .delete(users)
        .where(lt(users.deletionScheduledAt, new Date()))
        .returning({ id: users.id });

      if (deleted.length > 0) {
        this.logger.log(`Удалено аккаунтов по запросу владельцев: ${deleted.length}`);
      }
      return true;
    }, false);
  }

  private async deleteExpiredEmailTokens(): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db.delete(emailTokens).where(lt(emailTokens.expiresAt, new Date()));
      return true;
    }, false);
  }
}
