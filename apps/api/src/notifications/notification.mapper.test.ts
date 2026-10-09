import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  NotificationItemSchema,
} from '@tanuki/contracts';
import type { NotificationRecord } from './models';
import { toNotificationItem } from './notification.mapper';

const SECRET = 'secret-secret-secret';

const record = (overrides: Partial<NotificationRecord>): NotificationRecord => ({
  id: '00000000-0000-4000-8000-000000000001',
  userId: 'user',
  type: NOTIFICATION_TYPE.NEW_CHAPTERS,
  groupKey: 'chapters:a',
  payload: {},
  count: 3,
  createdAt: new Date('2026-10-09T10:00:00Z'),
  updatedAt: new Date('2026-10-09T11:00:00.500Z'),
  ...overrides,
});

describe('toNotificationItem', () => {
  it('новые главы: обложка подписывается, остальное — снимок', () => {
    const item = toNotificationItem(
      record({
        payload: {
          titleId: 'readmanga_ru:abc',
          sourceId: 'readmanga_ru',
          name: 'Берсерк',
          coverUrl: 'https://cdn.example/cover.jpg',
          coverSourceId: 'mangalib',
        },
      }),
      SECRET,
    );

    expect(item).toMatchObject({
      type: NOTIFICATION_TYPE.NEW_CHAPTERS,
      category: NOTIFICATION_CATEGORY.CHAPTERS,
      count: 3,
      createdAt: '2026-10-09T10:00:00Z',
      updatedAt: '2026-10-09T11:00:00Z',
      payload: { titleId: 'readmanga_ru:abc', sourceId: 'readmanga_ru', name: 'Берсерк' },
    });
    if (item.type !== NOTIFICATION_TYPE.NEW_CHAPTERS) throw new Error('unreachable');
    expect(item.payload.coverUrl).toMatch(/^\/api\/v1\/img\?/);
    expect(item.payload.coverUrl).toContain('s=mangalib');
  });

  it('без обложки отдаёт пустую строку', () => {
    const item = toNotificationItem(
      record({ payload: { titleId: 't', sourceId: 's', name: 'n', coverUrl: null } }),
      SECRET,
    );

    expect(item.type === NOTIFICATION_TYPE.NEW_CHAPTERS && item.payload.coverUrl).toBe('');
  });

  it('лишние поля payload наружу не уходят, результат проходит схему контракта', () => {
    const item = toNotificationItem(
      record({
        type: NOTIFICATION_TYPE.INVITE_USED,
        count: 1,
        payload: { inviteId: 'i1', username: 'neo', secret: 'leak' },
      }),
      SECRET,
    );

    expect(item.payload).toEqual({ inviteId: 'i1', username: 'neo' });
    expect(NotificationItemSchema.safeParse(item).success).toBe(true);
  });
});
