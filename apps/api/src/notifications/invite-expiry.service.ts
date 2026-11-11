import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, gt, isNotNull, isNull, lte } from 'drizzle-orm';
import { reportUnexpected } from '../observability/sentry';
import { NOTIFICATION_TYPE } from '@tanuki/contracts';
import { DatabaseService } from '../database/database.service';
import { invites } from '../database/schema';
import { INVITE_EXPIRY_CHECK_INTERVAL_MS } from './models';
import { NotificationsService } from './notifications.service';

/**
 * Статус «истёк» у инвайта вычисляется на чтении, и события в коде нет, поэтому раз в час
 * берутся неиспользованные инвайты, истёкшие за прошедший полный час. Окна идут встык, так что одно
 * истечение уведомляет создателя ровно один раз (если сервис работал в этот час).
 */
@Injectable()
export class InviteExpiryService {
  private readonly logger = new Logger(InviteExpiryService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async notifyExpired(now = new Date()): Promise<void> {
    try {
      // Окно — от границы часа, а не от момента срабатывания: иначе между окнами бывают зазоры.
      const until = new Date(
        Math.floor(now.getTime() / INVITE_EXPIRY_CHECK_INTERVAL_MS) *
          INVITE_EXPIRY_CHECK_INTERVAL_MS,
      );
      const since = new Date(until.getTime() - INVITE_EXPIRY_CHECK_INTERVAL_MS);
      const expired = await this.database.db
        .select({ id: invites.id, createdBy: invites.createdBy })
        .from(invites)
        .where(
          and(
            isNull(invites.usedAt),
            isNull(invites.revokedAt),
            isNotNull(invites.createdBy),
            gt(invites.expiresAt, since),
            lte(invites.expiresAt, until),
          ),
        );

      for (const { id, createdBy } of expired) {
        if (!createdBy) continue;
        await this.notifications.notify(createdBy, {
          type: NOTIFICATION_TYPE.INVITE_EXPIRED,
          groupKey: `invite:${id}`,
          payload: { inviteId: id },
        });
      }
    } catch (error) {
      reportUnexpected(error);
      this.logger.warn(`Истёкшие инвайты не обработаны: ${(error as Error).message}`);
    }
  }
}
