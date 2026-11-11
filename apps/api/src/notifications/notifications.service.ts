import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, count, desc, eq, inArray, lt, notInArray, sql } from 'drizzle-orm';
import { reportUnexpected } from '../observability/sentry';
import {
  getNotificationCategory,
  getNotificationTypes,
  isStaffRole,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_STREAM_EVENT,
  NOTIFICATION_TYPE,
  NOTIFICATIONS_PAGE_SIZE,
  NOTIFICATIONS_PER_USER_LIMIT,
  type NotificationCategory,
  type NotificationItem,
  type NotificationsPage,
  type NotificationsQuery,
  type NotificationType,
  type UnreadCount,
  type UserRole,
} from '@tanuki/contracts';
import { NotFoundApiException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { notifications } from '../database/schema';
import {
  NEW_CHAPTERS_PUSH_LIMIT,
  NOTIFICATION_TTL_MS,
  type NewChaptersSnapshot,
  type NotificationInput,
  type NotificationRecord,
  type NotificationViewer,
  type NotificationWrite,
} from './models';
import { toNotificationItem } from './notification.mapper';
import { NotificationsHubService } from './notifications-hub.service';
import { buildNewChaptersDigest, buildPushMessage } from './push-message';
import { PushService } from './push.service';

/** Разброс часов БД и процесса API при сравнении «глава найдена после прошлого прохода». */
const CLOCK_TOLERANCE_MS = 60_000;

export const newChaptersGroupKey = (groupKey: string) => `chapters:${groupKey}`;

/** Типы, которые пользователь вообще видит: «Администрирование» — только админам и модераторам. */
export const getVisibleNotificationTypes = (role: UserRole): NotificationType[] =>
  Object.values(NOTIFICATION_CATEGORY)
    .filter((category) => category !== NOTIFICATION_CATEGORY.ADMINISTRATION || isStaffRole(role))
    .flatMap((category) => getNotificationTypes(category));

/**
 * Лента уведомлений. «Прочитано» — это удаление записи; создание и переписывание идут через
 * `notify`, который заодно сообщает открытым вкладкам и отправляет push.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly hub: NotificationsHubService,
    private readonly push: PushService,
  ) {}

  async list(viewer: NotificationViewer, query: NotificationsQuery): Promise<NotificationsPage> {
    const types = this.typesFor(viewer.role, query.category);
    if (types.length === 0) return { items: [], page: query.page, total: 0 };

    const where = and(eq(notifications.userId, viewer.id), inArray(notifications.type, types));
    return this.database.withFallback(
      async () => {
        const [rows, [totalRow]] = await Promise.all([
          this.database.db
            .select()
            .from(notifications)
            .where(where)
            .orderBy(desc(notifications.updatedAt), desc(notifications.id))
            .limit(NOTIFICATIONS_PAGE_SIZE)
            .offset((query.page - 1) * NOTIFICATIONS_PAGE_SIZE),
          this.database.db.select({ value: count() }).from(notifications).where(where),
        ]);
        return {
          items: rows.map((row) => this.toItem(row)),
          page: query.page,
          total: totalRow?.value ?? 0,
        };
      },
      { items: [], page: query.page, total: 0 },
    );
  }

  async countUnread(viewer: NotificationViewer): Promise<UnreadCount> {
    return this.database.withFallback(
      async () => {
        const [row] = await this.database.db
          .select({ value: count() })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, viewer.id),
              inArray(notifications.type, getVisibleNotificationTypes(viewer.role)),
            ),
          );
        return { count: row?.value ?? 0 };
      },
      { count: 0 },
    );
  }

  /** «Прочитано» одной записи — её удаление; чужой или уже убранной записи нет. */
  async remove(userId: string, id: string): Promise<void> {
    const removed = await this.database.db
      .delete(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.id, id)))
      .returning({ id: notifications.id });
    if (removed.length === 0) throw new NotFoundApiException();
    this.hub.publish(userId, { type: NOTIFICATION_STREAM_EVENT.REMOVED, id });
  }

  /** «Прочитано» всего, что видно с учётом категории. */
  async removeAll(viewer: NotificationViewer, category: NotificationCategory[] | undefined) {
    const types = this.typesFor(viewer.role, category);
    if (types.length === 0) return;

    await this.database.db
      .delete(notifications)
      .where(and(eq(notifications.userId, viewer.id), inArray(notifications.type, types)));
    this.hub.publish(viewer.id, { type: NOTIFICATION_STREAM_EVENT.REMOVED });
  }

  /** Событие, у которого своя запись на каждое срабатывание (аккаунт, инвайты). */
  async notifyEvent(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    await this.notify(userId, { type, groupKey: `event:${randomUUID()}`, payload });
  }

  /**
   * Создаёт запись или переписывает ту, что с тем же `groupKey`. Push уходит, когда запись
   * создана или сменила тип; рост `count` push не повторяет. Сбой не пробрасывается:
   * уведомление — побочный эффект события, которое само уже случилось.
   */
  async notify(
    userId: string,
    input: NotificationInput,
    options: { isPushEnabled?: boolean } = {},
  ): Promise<NotificationWrite | null> {
    try {
      const write = await this.write(userId, input);
      const item = this.toItem(write.record);
      this.hub.publish(userId, {
        type: write.isCreated
          ? NOTIFICATION_STREAM_EVENT.CREATED
          : NOTIFICATION_STREAM_EVENT.UPDATED,
        notification: item,
      });
      if (write.isCreated) await this.trimOverflow(userId);

      if ((options.isPushEnabled ?? true) && (write.isCreated || write.isTypeChanged)) {
        // Push не ждём: медленный push-сервис не должен задерживать событие (например, вход).
        void this.push.sendToUser(userId, (language) => buildPushMessage(write.record, language));
      }
      return write;
    } catch (error) {
      reportUnexpected(error);
      this.logger.warn(`Уведомление ${input.type} не создано: ${(error as Error).message}`);
      return null;
    }
  }

  /** Убирает записи по `groupKey` — например, когда новые главы стали прочитанными. */
  async removeByGroupKeys(userId: string, groupKeys: string[]): Promise<void> {
    if (groupKeys.length === 0) return;
    try {
      const removed = await this.database.db
        .delete(notifications)
        .where(and(eq(notifications.userId, userId), inArray(notifications.groupKey, groupKeys)))
        .returning({ id: notifications.id });
      for (const { id } of removed) {
        this.hub.publish(userId, { type: NOTIFICATION_STREAM_EVENT.REMOVED, id });
      }
    } catch (error) {
      reportUnexpected(error);
      this.logger.warn(`Уведомления не убраны: ${(error as Error).message}`);
    }
  }

  /** Убирает новые главы по ключам тайтлов группы закладки. */
  async removeNewChapters(userId: string, titleKeys: string[]): Promise<void> {
    await this.removeByGroupKeys(userId, titleKeys.map(newChaptersGroupKey));
  }

  /**
   * Итог прохода крона закладок для одного пользователя. Записи создаются для групп, чьи главы
   * нашли именно в этом проходе (иначе убранное «×» уведомление возвращалось бы каждые три
   * часа); `count` выставляется равным текущему числу новых глав, а не прибавляется. Записи
   * групп, у которых новых глав больше нет, убираются — кроме `heldKeys`: у них цель недоступна
   * (источник лёг, выключен), и нулевой счётчик не значит, что главы прочитаны.
   *
   * `since` — когда в прошлый раз свели ленту: главы, увиденные позже (крон, каталог, визит),
   * считаются найденными сейчас.
   */
  async syncNewChapters(userId: string, snapshot: NewChaptersSnapshot, since: Date): Promise<void> {
    try {
      const { groups, heldKeys } = snapshot;
      const current = [...groups.map(({ key }) => key), ...heldKeys].map(newChaptersGroupKey);
      const stale = await this.database.db
        .select({ groupKey: notifications.groupKey })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.type, NOTIFICATION_TYPE.NEW_CHAPTERS),
            current.length > 0 ? notInArray(notifications.groupKey, current) : undefined,
          ),
        );
      await this.removeByGroupKeys(
        userId,
        stale.map(({ groupKey }) => groupKey),
      );

      const threshold = since.getTime() - CLOCK_TOLERANCE_MS;
      const found = groups.filter(
        ({ latestNewAt }) => latestNewAt && latestNewAt.getTime() >= threshold,
      );
      const created: NotificationRecord[] = [];
      for (const group of found) {
        const write = await this.notify(
          userId,
          {
            type: NOTIFICATION_TYPE.NEW_CHAPTERS,
            groupKey: newChaptersGroupKey(group.key),
            count: group.count,
            payload: {
              titleId: group.titleId,
              sourceId: group.sourceId,
              name: group.name,
              coverUrl: group.coverUrl,
              coverSourceId: group.coverSourceId,
            },
          },
          { isPushEnabled: false },
        );
        if (write?.isCreated) created.push(write.record);
      }

      if (created.length > NEW_CHAPTERS_PUSH_LIMIT) {
        const digest = buildNewChaptersDigest.bind(null, created.length);
        await this.push.sendToUser(userId, digest);
        return;
      }
      for (const record of created) {
        await this.push.sendToUser(userId, (language) => buildPushMessage(record, language));
      }
    } catch (error) {
      reportUnexpected(error);
      this.logger.warn(`Новые главы ${userId} не сведены: ${(error as Error).message}`);
    }
  }

  /** Раз в сутки: непрочитанное старше срока хранения уходит. */
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async cleanup(): Promise<void> {
    await this.database.withFallback(async () => {
      const removed = await this.database.db
        .delete(notifications)
        .where(lt(notifications.updatedAt, new Date(Date.now() - NOTIFICATION_TTL_MS)))
        .returning({ id: notifications.id });
      if (removed.length > 0) this.logger.log(`Удалено старых уведомлений: ${removed.length}`);
      return true;
    }, false);
  }

  private typesFor(
    role: UserRole,
    categories: NotificationCategory[] | undefined,
  ): NotificationType[] {
    const visible = getVisibleNotificationTypes(role);
    if (!categories || categories.length === 0) return visible;
    return visible.filter((type) => categories.includes(getNotificationCategory(type)));
  }

  private toItem(record: NotificationRecord): NotificationItem {
    return toNotificationItem(record, this.env.IMG_SIGN_SECRET);
  }

  private async write(userId: string, input: NotificationInput): Promise<NotificationWrite> {
    const [existing] = await this.database.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.groupKey, input.groupKey)))
      .limit(1);
    const isTypeChanged = !!existing && existing.type !== input.type;

    const values = {
      type: input.type,
      payload: input.payload,
      count: input.count ?? 1,
      updatedAt: sql`now()`,
      // Возврат источника — новое событие: запись поднимается как только что созданная.
      ...(isTypeChanged ? { createdAt: sql`now()` } : {}),
    };
    const [record] = await this.database.db
      .insert(notifications)
      .values({ userId, groupKey: input.groupKey, ...values })
      .onConflictDoUpdate({
        target: [notifications.userId, notifications.groupKey],
        set: values,
      })
      .returning();
    if (!record) throw new Error('Запись уведомления не вернулась из базы');

    return { record, isCreated: !existing, isTypeChanged };
  }

  /** Больше `NOTIFICATIONS_PER_USER_LIMIT` записей — самые старые уходят. */
  private async trimOverflow(userId: string): Promise<void> {
    const overflow = await this.database.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.updatedAt), desc(notifications.id))
      .offset(NOTIFICATIONS_PER_USER_LIMIT);
    if (overflow.length === 0) return;

    await this.database.db.delete(notifications).where(
      inArray(
        notifications.id,
        overflow.map(({ id }) => id),
      ),
    );
    this.hub.publish(userId, { type: NOTIFICATION_STREAM_EVENT.REMOVED });
  }
}
