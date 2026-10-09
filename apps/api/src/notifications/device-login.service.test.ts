import { describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_TYPE } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import { DeviceLoginService, identifyDevice } from './device-login.service';
import type { NotificationsService } from './notifications.service';

const CHROME_MAC_130 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const CHROME_MAC_131 = CHROME_MAC_130.replace('130.0.0.0', '131.0.0.0');
const FIREFOX_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0';

describe('identifyDevice', () => {
  it('обновление браузера не делает устройство новым', () => {
    expect(identifyDevice(CHROME_MAC_130)?.fingerprint).toBe(
      identifyDevice(CHROME_MAC_131)?.fingerprint,
    );
  });

  it('другой браузер и ОС — другое устройство', () => {
    expect(identifyDevice(CHROME_MAC_130)?.fingerprint).not.toBe(
      identifyDevice(FIREFOX_WIN)?.fingerprint,
    );
  });

  it('подписывает «браузер · ОС»', () => {
    expect(identifyDevice(CHROME_MAC_130)?.label).toBe('Chrome · macOS');
  });

  it('без User-Agent устройство не распознать', () => {
    expect(identifyDevice(undefined)).toBeNull();
    expect(identifyDevice('')).toBeNull();
  });
});

type Fake = { knownCount: number; sessions: { userAgent: string | null }[]; isNew: boolean };

const createService = ({ knownCount, sessions, isNew }: Fake) => {
  const select = vi
    .fn()
    // count() известных устройств, затем сессии пользователя
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([{ value: knownCount }]) }),
    })
    .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve(sessions) }) });
  const insert = vi.fn().mockReturnValue({
    values: () => ({
      onConflictDoNothing: () => Promise.resolve(),
      onConflictDoUpdate: () => ({ returning: () => Promise.resolve([{ isNew }]) }),
    }),
  });
  const notifyEvent = vi.fn().mockResolvedValue(undefined);
  const service = new DeviceLoginService(
    { db: { select, insert } } as unknown as DatabaseService,
    { notifyEvent } as unknown as NotificationsService,
  );
  return { service, notifyEvent };
};

describe('DeviceLoginService.recordLogin', () => {
  it('первый вход аккаунта уведомления не создаёт', async () => {
    const { service, notifyEvent } = createService({ knownCount: 0, sessions: [], isNew: true });

    await service.recordLogin('user', CHROME_MAC_130);

    expect(notifyEvent).not.toHaveBeenCalled();
  });

  it('новое устройство при уже известных — уведомление с подписью', async () => {
    const { service, notifyEvent } = createService({
      knownCount: 1,
      sessions: [],
      isNew: true,
    });

    await service.recordLogin('user', FIREFOX_WIN);

    expect(notifyEvent).toHaveBeenCalledWith('user', NOTIFICATION_TYPE.NEW_DEVICE_LOGIN, {
      device: 'Firefox · Windows',
    });
  });

  it('знакомое устройство уведомления не создаёт', async () => {
    const { service, notifyEvent } = createService({ knownCount: 1, sessions: [], isNew: false });

    await service.recordLogin('user', CHROME_MAC_130);

    expect(notifyEvent).not.toHaveBeenCalled();
  });

  it('у аккаунта с прежними сессиями, но пустой таблицей, новое устройство всё же уведомляет', async () => {
    const { service, notifyEvent } = createService({
      knownCount: 0,
      sessions: [{ userAgent: FIREFOX_WIN }],
      isNew: true,
    });

    await service.recordLogin('user', CHROME_MAC_130);

    expect(notifyEvent).toHaveBeenCalledTimes(1);
  });

  it('сбой не пробрасывается: вход не должен ломаться', async () => {
    const service = new DeviceLoginService(
      {
        db: {
          select: () => {
            throw new Error('db down');
          },
        },
      } as unknown as DatabaseService,
      {} as NotificationsService,
    );

    await expect(service.recordLogin('user', CHROME_MAC_130)).resolves.toBeUndefined();
  });
});
