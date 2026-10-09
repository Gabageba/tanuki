import { describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_STREAM_EVENT,
  NOTIFICATION_TYPE,
  USER_ROLE,
  getNotificationCategory,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import type { DatabaseService } from '../database/database.service';
import { NEW_CHAPTERS_PUSH_LIMIT, type NewChaptersGroup, type NotificationRecord } from './models';
import type { NotificationsHubService } from './notifications-hub.service';
import { getVisibleNotificationTypes, NotificationsService } from './notifications.service';
import type { PushService } from './push.service';

const NOW = new Date('2026-10-09T12:00:00Z');

const record = (overrides: Partial<NotificationRecord> = {}): NotificationRecord => ({
  id: '00000000-0000-4000-8000-000000000001',
  userId: 'user',
  type: NOTIFICATION_TYPE.SOURCE_DOWN,
  groupKey: 'source:readmanga_ru',
  payload: { sourceId: 'readmanga_ru', reason: 'probeFailed' },
  count: 1,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

/** Любая цепочка drizzle-вызовов, которую можно `await`'нуть: отдаёт заданный результат. */
const chain = (result: unknown): unknown =>
  new Proxy(
    {},
    {
      get: (_, property) =>
        property === 'then'
          ? (resolve: (value: unknown) => void) => resolve(result)
          : () => chain(result),
    },
  );

type Setup = { existing?: NotificationRecord; written: NotificationRecord };

const createService = ({ existing, written }: Setup) => {
  const select = vi
    .fn()
    // Запись с тем же groupKey, затем проверка переполнения ленты.
    .mockReturnValueOnce(chain(existing ? [existing] : []))
    .mockReturnValue(chain([]));
  const insert = vi.fn().mockReturnValue(chain([written]));
  const publish = vi.fn();
  const sendToUser = vi.fn().mockResolvedValue(undefined);
  const service = new NotificationsService(
    { IMG_SIGN_SECRET: 'secret-secret-secret' } as Env,
    { db: { select, insert } } as unknown as DatabaseService,
    { publish } as unknown as NotificationsHubService,
    { sendToUser } as unknown as PushService,
  );
  return { service, publish, sendToUser };
};

describe('getVisibleNotificationTypes', () => {
  it('обычному пользователю не показывает администрирование', () => {
    const types = getVisibleNotificationTypes(USER_ROLE.USER);

    expect(types).toContain(NOTIFICATION_TYPE.NEW_CHAPTERS);
    expect(types).not.toContain(NOTIFICATION_TYPE.PARSER_DOWN);
    expect(types).not.toContain(NOTIFICATION_TYPE.INVITE_USED);
  });

  it('модератору и админу показывает все категории', () => {
    for (const role of [USER_ROLE.ADMIN, USER_ROLE.MODERATOR]) {
      const categories = new Set(getVisibleNotificationTypes(role).map(getNotificationCategory));
      expect(categories).toEqual(new Set(Object.values(NOTIFICATION_CATEGORY)));
    }
  });
});

describe('NotificationsService.notify', () => {
  const input = {
    type: NOTIFICATION_TYPE.SOURCE_DOWN,
    groupKey: 'source:readmanga_ru',
    payload: { sourceId: 'readmanga_ru' },
  };

  it('новая запись: событие created и push', async () => {
    const { service, publish, sendToUser } = createService({ written: record() });

    const write = await service.notify('user', input);

    expect(write).toMatchObject({ isCreated: true, isTypeChanged: false });
    expect(publish.mock.calls[0]![1].type).toBe(NOTIFICATION_STREAM_EVENT.CREATED);
    expect(sendToUser).toHaveBeenCalledTimes(1);
  });

  it('рост счётчика у той же записи: событие updated без нового push', async () => {
    const existing = record({ type: NOTIFICATION_TYPE.NEW_CHAPTERS, groupKey: 'chapters:a' });
    const { service, publish, sendToUser } = createService({
      existing,
      written: { ...existing, count: 4 },
    });

    await service.notify('user', {
      type: NOTIFICATION_TYPE.NEW_CHAPTERS,
      groupKey: 'chapters:a',
      payload: {},
      count: 4,
    });

    expect(publish.mock.calls[0]![1].type).toBe(NOTIFICATION_STREAM_EVENT.UPDATED);
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it('запись сменила тип (источник ожил): push уходит снова', async () => {
    const existing = record();
    const { service, sendToUser } = createService({
      existing,
      written: { ...existing, type: NOTIFICATION_TYPE.SOURCE_RECOVERED },
    });

    const write = await service.notify('user', {
      ...input,
      type: NOTIFICATION_TYPE.SOURCE_RECOVERED,
    });

    expect(write).toMatchObject({ isCreated: false, isTypeChanged: true });
    expect(sendToUser).toHaveBeenCalledTimes(1);
  });

  it('push можно отключить для вызывающего', async () => {
    const { service, sendToUser } = createService({ written: record() });

    await service.notify('user', input, { isPushEnabled: false });

    expect(sendToUser).not.toHaveBeenCalled();
  });

  it('сбой базы не пробрасывается', async () => {
    const service = new NotificationsService(
      { IMG_SIGN_SECRET: 'secret-secret-secret' } as Env,
      {
        db: {
          select: () => {
            throw new Error('db down');
          },
        },
      } as unknown as DatabaseService,
      {} as NotificationsHubService,
      {} as PushService,
    );

    await expect(service.notify('user', input)).resolves.toBeNull();
  });
});

const group = (key: string, latestNewAt: Date | null): NewChaptersGroup => ({
  key,
  titleId: `${key}-id`,
  sourceId: 'readmanga_ru',
  name: key,
  coverUrl: null,
  coverSourceId: 'readmanga_ru',
  count: 2,
  latestNewAt,
});

describe('NotificationsService.syncNewChapters', () => {
  const since = NOW;
  const found = new Date(NOW.getTime() + 60_000);
  const old = new Date(NOW.getTime() - 3 * 60 * 60 * 1000);

  const createSyncService = () => {
    const { service, sendToUser } = createService({ written: record() });
    const database = (service as unknown as { database: { db: { select: unknown } } }).database;
    database.db.select = vi.fn().mockReturnValue(chain([{ groupKey: 'chapters:gone' }]));
    const removeByGroupKeys = vi.spyOn(service, 'removeByGroupKeys').mockResolvedValue(undefined);
    const notify = vi.spyOn(service, 'notify').mockImplementation((_, input) =>
      Promise.resolve({
        record: record({ type: input.type, groupKey: input.groupKey }),
        isCreated: true,
        isTypeChanged: false,
      }),
    );
    return { service, sendToUser, removeByGroupKeys, notify };
  };

  it('убирает записи групп, у которых новых глав больше нет', async () => {
    const { service, removeByGroupKeys } = createSyncService();

    await service.syncNewChapters('user', { groups: [group('a', found)], heldKeys: [] }, since);

    expect(removeByGroupKeys).toHaveBeenCalledWith('user', ['chapters:gone']);
  });

  it('создаёт записи только для глав, найденных после прошлого сведения', async () => {
    const { service, notify } = createSyncService();

    await service.syncNewChapters(
      'user',
      {
        groups: [group('fresh', found), group('seen-before', old), group('no-date', null)],
        heldKeys: [],
      },
      since,
    );

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0]![1].groupKey).toBe('chapters:fresh');
    expect(notify.mock.calls[0]![1].count).toBe(2);
  });

  it('до лимита — по push на тайтл', async () => {
    const { service, sendToUser } = createSyncService();
    const groups = Array.from({ length: NEW_CHAPTERS_PUSH_LIMIT }, (_, index) =>
      group(`t${index}`, found),
    );

    await service.syncNewChapters('user', { groups, heldKeys: [] }, since);

    expect(sendToUser).toHaveBeenCalledTimes(NEW_CHAPTERS_PUSH_LIMIT);
  });

  it('сверх лимита — один сводный push', async () => {
    const { service, sendToUser } = createSyncService();
    const groups = Array.from({ length: NEW_CHAPTERS_PUSH_LIMIT + 1 }, (_, index) =>
      group(`t${index}`, found),
    );

    await service.syncNewChapters('user', { groups, heldKeys: [] }, since);

    expect(sendToUser).toHaveBeenCalledTimes(1);
    const build = sendToUser.mock.calls[0]![1] as (language: 'ru') => { body: string };
    expect(build('ru').body).toBe(`Новые главы в ${NEW_CHAPTERS_PUSH_LIMIT + 1} тайтлах`);
  });
});
