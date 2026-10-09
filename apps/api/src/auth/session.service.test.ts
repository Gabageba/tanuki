import { describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import type { DeviceLoginService } from '../notifications/device-login.service';
import { SESSION_IDLE_MS, SESSION_REMEMBER_MS, SESSION_TOUCH_INTERVAL_MS } from './models';
import { SessionService } from './session.service';

const baseSession = {
  id: 's1',
  userId: 'u1',
  tokenHash: 'hash',
  remember: false,
  expiresAt: new Date(),
  lastSeenAt: new Date(),
  userAgent: null,
  ip: null,
  createdAt: new Date(),
};

// touch() решает, продлевать ли, ещё до похода в БД — withFallback здесь просто подтверждает
// «применено», как и реальный DatabaseService при успешной записи. Саму операцию не вызываем:
// ей нужен настоящий this.database.db, а тут проверяется только решение touch(), не SQL.
const fakeDatabase = {
  withFallback: <T>(_operation: () => Promise<T>, _fallback: T) => Promise.resolve(true as T),
} as unknown as DatabaseService;

const fakeDeviceLogin = { recordLogin: () => Promise.resolve() } as unknown as DeviceLoginService;

describe('SessionService.touch', () => {
  it('ничего не делает, если с прошлой записи прошло меньше часа', async () => {
    const service = new SessionService(fakeDatabase, fakeDeviceLogin);
    const recent = { ...baseSession, lastSeenAt: new Date(Date.now() - 1000) };

    await expect(service.touch(recent)).resolves.toBeNull();
  });

  it('продлевает idle-сессию на SESSION_IDLE_MS от текущего момента', async () => {
    const service = new SessionService(fakeDatabase, fakeDeviceLogin);
    const stale = {
      ...baseSession,
      remember: false,
      lastSeenAt: new Date(Date.now() - SESSION_TOUCH_INTERVAL_MS - 1000),
    };

    const before = Date.now();
    const result = await service.touch(stale);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThanOrEqual(before + SESSION_IDLE_MS - 1000);
    expect(result!.getTime()).toBeLessThanOrEqual(Date.now() + SESSION_IDLE_MS);
  });

  it('remember-сессию продлевает на куда больший SESSION_REMEMBER_MS', async () => {
    const service = new SessionService(fakeDatabase, fakeDeviceLogin);
    const stale = {
      ...baseSession,
      remember: true,
      lastSeenAt: new Date(Date.now() - SESSION_TOUCH_INTERVAL_MS - 1000),
    };

    const result = await service.touch(stale);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThan(Date.now() + SESSION_IDLE_MS);
    expect(result!.getTime()).toBeLessThanOrEqual(Date.now() + SESSION_REMEMBER_MS);
  });

  it('при недоступной базе всё равно возвращает новый срок — вызывающий (guard) сам решает, что с cookie', async () => {
    const unavailable = {
      withFallback: vi.fn((_op: () => Promise<unknown>, fallback: unknown) =>
        Promise.resolve(fallback),
      ),
    } as unknown as DatabaseService;
    const service = new SessionService(unavailable, fakeDeviceLogin);
    const stale = {
      ...baseSession,
      lastSeenAt: new Date(Date.now() - SESSION_TOUCH_INTERVAL_MS - 1),
    };

    await expect(service.touch(stale)).resolves.toBeInstanceOf(Date);
  });
});
