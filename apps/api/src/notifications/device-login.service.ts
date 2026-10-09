import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import Bowser from 'bowser';
import { and, count, eq, sql } from 'drizzle-orm';
import { NOTIFICATION_TYPE } from '@tanuki/contracts';
import { DatabaseService } from '../database/database.service';
import { knownDevices, sessions } from '../database/schema';
import type { DeviceIdentity } from './models';
import { NotificationsService } from './notifications.service';

/**
 * Отпечаток устройства — «браузер + ОС + тип платформы» из User-Agent, без версий: обновление
 * браузера не делает устройство новым. Без User-Agent устройства не распознать — null.
 */
export const identifyDevice = (userAgent: string | null | undefined): DeviceIdentity | null => {
  if (!userAgent) return null;
  const parsed = Bowser.parse(userAgent);
  const browser = parsed.browser.name;
  const os = parsed.os.name;
  if (!browser && !os) return null;

  const fingerprint = createHash('sha256')
    .update([browser ?? '', os ?? '', parsed.platform.type ?? ''].join('|'))
    .digest('hex');
  const label = [browser, os].filter(Boolean).join(' · ');
  return { fingerprint, label };
};

/**
 * «Вход с нового устройства». Известные устройства копятся в `known_devices`; первый вход
 * аккаунта и вход со знакомого устройства уведомления не создают. Пользователи, у которых
 * таблица ещё пуста, а сессии были, засеваются из этих сессий — иначе после выкладки каждый
 * получил бы ложное «новое устройство».
 */
@Injectable()
export class DeviceLoginService {
  private readonly logger = new Logger(DeviceLoginService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Вызывается до создания сессии входа. Любой сбой гасится: вход не должен ломаться из-за
   * уведомления о нём.
   */
  async recordLogin(userId: string, userAgent: string | undefined): Promise<void> {
    try {
      const device = identifyDevice(userAgent);
      if (!device) return;

      const isFirstLogin = await this.seedFromSessions(userId);
      const [saved] = await this.database.db
        .insert(knownDevices)
        .values({ userId, ...device })
        .onConflictDoUpdate({
          target: [knownDevices.userId, knownDevices.fingerprint],
          set: { lastSeenAt: sql`now()` },
        })
        .returning({ isNew: sql<boolean>`(xmax = 0)` });

      if (saved?.isNew && !isFirstLogin) {
        await this.notifications.notifyEvent(userId, NOTIFICATION_TYPE.NEW_DEVICE_LOGIN, {
          device: device.label,
        });
      }
    } catch (error) {
      this.logger.warn(`Вход с устройства не записан: ${(error as Error).message}`);
    }
  }

  /**
   * Если у пользователя ещё нет известных устройств, берёт их из прежних сессий. Возвращает true,
   * когда и сессий не было — это первый вход аккаунта.
   */
  private async seedFromSessions(userId: string): Promise<boolean> {
    const [known] = await this.database.db
      .select({ value: count() })
      .from(knownDevices)
      .where(eq(knownDevices.userId, userId));
    if ((known?.value ?? 0) > 0) return false;

    const previous = await this.database.db
      .select({ userAgent: sessions.userAgent })
      .from(sessions)
      .where(and(eq(sessions.userId, userId)));
    const devices = new Map<string, DeviceIdentity>();
    for (const { userAgent } of previous) {
      const device = identifyDevice(userAgent);
      if (device) devices.set(device.fingerprint, device);
    }
    if (devices.size > 0) {
      await this.database.db
        .insert(knownDevices)
        .values([...devices.values()].map((device) => ({ userId, ...device })))
        .onConflictDoNothing();
    }
    return previous.length === 0;
  }
}
