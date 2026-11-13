import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, notExists } from 'drizzle-orm';
import { reportUnexpected } from '../observability/sentry';
import {
  NOTIFICATION_TYPE,
  SOURCE_STATUS,
  USER_ROLE,
  type SourceStatus,
  type SourceStatusReason,
} from '@tanuki/contracts';
import { DatabaseService } from '../database/database.service';
import { bookmarks, disabledSources, users } from '../database/schema';
import { NotificationsService } from './notifications.service';

/**
 * Уведомления о том, что источник лёг или ожил. Тревога только на переходах «стал down» и
 * «вернулся из down в ok»: `degraded` шума не создаёт. Держателям закладок на источнике —
 * `sourceDown/Recovered` (одна запись на источник), админам и модераторам — `parserDown/Recovered`.
 */
@Injectable()
export class SourceStatusNotifierService {
  private readonly logger = new Logger(SourceStatusNotifierService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  async onStatusChanged(
    sourceId: string,
    previous: SourceStatus,
    next: SourceStatus,
    reason: SourceStatusReason,
  ): Promise<void> {
    const isDown = next === SOURCE_STATUS.DOWN && previous !== SOURCE_STATUS.DOWN;
    const isRecovered = previous === SOURCE_STATUS.DOWN && next === SOURCE_STATUS.OK;
    if (!isDown && !isRecovered) return;

    try {
      const [holders, staff] = await Promise.all([
        this.findBookmarkHolders(sourceId),
        this.findStaff(),
      ]);

      const userPayload = isDown ? { sourceId, reason } : { sourceId };
      const userType = isDown ? NOTIFICATION_TYPE.SOURCE_DOWN : NOTIFICATION_TYPE.SOURCE_RECOVERED;
      for (const userId of holders) {
        await this.notifications.notify(userId, {
          type: userType,
          groupKey: `source:${sourceId}`,
          payload: userPayload,
        });
      }

      const staffType = isDown ? NOTIFICATION_TYPE.PARSER_DOWN : NOTIFICATION_TYPE.PARSER_RECOVERED;
      for (const userId of staff) {
        await this.notifications.notify(userId, {
          type: staffType,
          groupKey: `parser:${sourceId}`,
          payload: userPayload,
        });
      }
    } catch (error) {
      reportUnexpected(error);
      this.logger.warn(
        `Уведомления об источнике ${sourceId} не созданы: ${(error as Error).message}`,
      );
    }
  }

  /** Пользователи с закладкой на источнике в любой папке, кроме выключивших его у себя. */
  private async findBookmarkHolders(sourceId: string): Promise<string[]> {
    const rows = await this.database.db
      .selectDistinct({ userId: bookmarks.userId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.sourceId, sourceId),
          notExists(
            this.database.db
              .select()
              .from(disabledSources)
              .where(
                and(
                  eq(disabledSources.userId, bookmarks.userId),
                  eq(disabledSources.sourceId, sourceId),
                ),
              ),
          ),
        ),
      );
    return rows.map(({ userId }) => userId);
  }

  private async findStaff(): Promise<string[]> {
    const rows = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, [USER_ROLE.ADMIN, USER_ROLE.MODERATOR]));
    return rows.map(({ id }) => id);
  }
}
