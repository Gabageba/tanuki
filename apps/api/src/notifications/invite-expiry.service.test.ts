import { describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_TYPE } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import { InviteExpiryService } from './invite-expiry.service';
import type { NotificationsService } from './notifications.service';

const createService = (expired: { id: string; createdBy: string | null }[]) => {
  const notify = vi.fn().mockResolvedValue(null);
  const service = new InviteExpiryService(
    {
      db: { select: () => ({ from: () => ({ where: () => Promise.resolve(expired) }) }) },
    } as unknown as DatabaseService,
    { notify } as unknown as NotificationsService,
  );
  return { service, notify };
};

describe('InviteExpiryService.notifyExpired', () => {
  it('сообщает создателю каждого истёкшего инвайта', async () => {
    const { service, notify } = createService([
      { id: 'i1', createdBy: 'admin-1' },
      { id: 'i2', createdBy: 'admin-2' },
    ]);

    await service.notifyExpired();

    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledWith('admin-1', {
      type: NOTIFICATION_TYPE.INVITE_EXPIRED,
      groupKey: 'invite:i1',
      payload: { inviteId: 'i1' },
    });
  });

  it('инвайт без создателя (первый, из CLI) никого не уведомляет', async () => {
    const { service, notify } = createService([{ id: 'i1', createdBy: null }]);

    await service.notifyExpired();

    expect(notify).not.toHaveBeenCalled();
  });
});
