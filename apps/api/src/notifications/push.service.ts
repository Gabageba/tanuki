import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import webPush from 'web-push';
import type { Language, PushConfig, PushSubscriptionInput } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import { pushSubscriptions, userSettings, users } from '../database/schema';
import type { PushMessage } from './models';

/** Коды ответа push-сервиса, при которых подписка мертва и подлежит удалению. */
const GONE_STATUS_CODES = [404, 410];

/** Push-сервис не отвечает дольше — отправка на это устройство бросается. */
const SEND_TIMEOUT_MS = 10_000;

/**
 * Web Push: подписки устройств и отправка. Без пары VAPID-ключей в конфиге сервис выключен —
 * лента и поток SSE работают без него, а `getConfig` сообщает клиенту, что push не предлагать.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly isEnabled: boolean;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
  ) {
    this.isEnabled = this.configureVapid();
  }

  getConfig(): PushConfig {
    return this.isEnabled
      ? { enabled: true, publicKey: this.env.VAPID_PUBLIC_KEY ?? '' }
      : { enabled: false, publicKey: '' };
  }

  /** Подписка устройства; тот же endpoint переходит к текущему пользователю и обновляет ключи. */
  async subscribe(
    userId: string,
    input: PushSubscriptionInput,
    userAgent: string | undefined,
  ): Promise<void> {
    const row = {
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent ?? null,
    };
    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .insert(pushSubscriptions)
        .values(row)
        .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: row });
      return true;
    }, false);
    if (!applied) throw new StorageUnavailableException();
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
      return true;
    }, false);
    if (!applied) throw new StorageUnavailableException();
  }

  /**
   * Рассылка на все устройства пользователя. Категории, выключенные в его настройках, пропускаются;
   * ошибки отправки в лог и не пробрасываются: push — довесок к записи в ленте, не её условие.
   */
  async sendToUser(userId: string, build: (language: Language) => PushMessage): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const [recipient] = await this.database.db
        .select({
          language: users.language,
          disabled: userSettings.pushDisabledCategories,
        })
        .from(users)
        .leftJoin(userSettings, eq(userSettings.userId, users.id))
        .where(eq(users.id, userId))
        .limit(1);
      if (!recipient) return;

      const message = build(recipient.language);
      if (recipient.disabled?.includes(message.category)) return;

      const subscriptions = await this.database.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
      if (subscriptions.length === 0) return;

      const body = JSON.stringify(message);
      const gone: string[] = [];
      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webPush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              body,
              { TTL: 24 * 60 * 60, timeout: SEND_TIMEOUT_MS },
            );
          } catch (error) {
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (statusCode !== undefined && GONE_STATUS_CODES.includes(statusCode)) {
              gone.push(subscription.endpoint);
            } else {
              this.logger.warn(`Push не отправлен: ${(error as Error).message}`);
            }
          }
        }),
      );

      if (gone.length > 0) {
        await this.database.db
          .delete(pushSubscriptions)
          .where(inArray(pushSubscriptions.endpoint, gone));
      }
    } catch (error) {
      this.logger.warn(`Push пользователю не отправлен: ${(error as Error).message}`);
    }
  }

  private configureVapid(): boolean {
    const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey } = this.env;
    if (!publicKey || !privateKey) {
      this.logger.log('Push выключен: не заданы VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
      return false;
    }
    try {
      webPush.setVapidDetails(this.env.VAPID_SUBJECT, publicKey, privateKey);
      return true;
    } catch (error) {
      this.logger.warn(`Push выключен: VAPID-ключи не подошли — ${(error as Error).message}`);
      return false;
    }
  }
}
