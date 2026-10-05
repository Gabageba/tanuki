import { describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE, USER_ROLE, type UserRole } from '@tanuki/contracts';
import type { SessionUser } from '../auth/session.service';
import type { DatabaseService } from '../database/database.service';
import type { invites } from '../database/schema';
import { InvitesService } from './invites.service';

type InviteRow = typeof invites.$inferSelect;

const HOUR_MS = 60 * 60 * 1000;

const actor = (role: UserRole, id = `${role}-id`) =>
  ({ id, role, username: `${role}_name` }) as SessionUser;

const ADMIN = actor(USER_ROLE.ADMIN);
const MODERATOR = actor(USER_ROLE.MODERATOR);

const inviteRow = (overrides: Partial<InviteRow> = {}): InviteRow => ({
  id: 'invite-id',
  codeHash: 'hash',
  role: USER_ROLE.USER,
  createdBy: ADMIN.id,
  expiresAt: new Date(Date.now() + HOUR_MS),
  usedBy: null,
  usedAt: null,
  revokedAt: null,
  revokedBy: null,
  createdAt: new Date(),
  ...overrides,
});

/** База, которая знает одно приглашение: голой строкой — для проверки прав, с именами — для ответа
 *  после отзыва. Запись отзыва и вставка нового только запоминаются. */
const makeService = (target: InviteRow | null) => {
  let withUsernames = false;
  const set = vi.fn(() => ({
    where: () => Object.assign(Promise.resolve(), { returning: async () => [{ id: 'invite-id' }] }),
  }));
  const values = vi.fn(() => ({ returning: async () => [inviteRow({ id: 'new-id' })] }));
  const query = {
    select: (fields?: object) => {
      withUsernames = fields !== undefined;
      return query;
    },
    from: () => query,
    leftJoin: () => query,
    $dynamic: () => query,
    where: () => query,
    limit: async () => {
      if (!target) return [];
      return withUsernames
        ? [
            {
              invite: target,
              createdByUsername: null,
              usedByUsername: null,
              usedByAvatarUpdatedAt: null,
              revokedByUsername: null,
            },
          ]
        : [target];
    },
  };
  const writes = { update: () => ({ set }), insert: () => ({ values }) };
  const database = {
    db: {
      ...query,
      ...writes,
      transaction: <T>(operation: (tx: typeof writes) => Promise<T>) => operation(writes),
    },
    withFallback: <T>(operation: () => Promise<T>) => operation(),
  } as unknown as DatabaseService;
  return { service: new InvitesService(database), set, values };
};

const rejectionCode = async (action: Promise<unknown>) => {
  try {
    await action;
    return null;
  } catch (error) {
    return (error as { code?: string }).code;
  }
};

describe('InvitesService — отзыв', () => {
  it('модератор не отзывает чужое приглашение', async () => {
    const { service, set } = makeService(inviteRow({ createdBy: ADMIN.id }));
    expect(await rejectionCode(service.revoke(MODERATOR, 'invite-id'))).toBe(
      API_ERROR_CODE.FORBIDDEN,
    );
    expect(set).not.toHaveBeenCalled();
  });

  it('модератор отзывает своё и записывается как отозвавший', async () => {
    const { service, set } = makeService(inviteRow({ createdBy: MODERATOR.id }));
    await service.revoke(MODERATOR, 'invite-id');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ revokedBy: MODERATOR.id }));
  });

  it('админ отзывает любое, в том числе из консоли', async () => {
    const { service, set } = makeService(inviteRow({ createdBy: null }));
    await service.revoke(ADMIN, 'invite-id');
    expect(set).toHaveBeenCalled();
  });

  it('использованное отозвать нельзя', async () => {
    const { service } = makeService(inviteRow({ usedAt: new Date(), usedBy: 'someone' }));
    expect(await rejectionCode(service.revoke(ADMIN, 'invite-id'))).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('истёкшее отозвать нельзя', async () => {
    const { service } = makeService(inviteRow({ expiresAt: new Date(Date.now() - HOUR_MS) }));
    expect(await rejectionCode(service.revoke(ADMIN, 'invite-id'))).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('несуществующее приглашение — 404', async () => {
    const { service } = makeService(null);
    expect(await rejectionCode(service.revoke(ADMIN, 'missing'))).toBe(API_ERROR_CODE.NOT_FOUND);
  });
});

describe('InvitesService — перевыпуск', () => {
  it('отзывает старое и выпускает новое с той же ролью и новым кодом', async () => {
    const { service, set, values } = makeService(inviteRow({ role: USER_ROLE.MODERATOR }));
    const created = await service.reissue(ADMIN, 'invite-id');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ revokedBy: ADMIN.id }));
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ role: USER_ROLE.MODERATOR, createdBy: ADMIN.id }),
    );
    expect(created.code).toEqual(expect.any(String));
    expect(created.createdByUsername).toBe(ADMIN.username);
  });

  it('модератор не перевыпускает чужое', async () => {
    const { service, values } = makeService(inviteRow({ createdBy: ADMIN.id }));
    expect(await rejectionCode(service.reissue(MODERATOR, 'invite-id'))).toBe(
      API_ERROR_CODE.FORBIDDEN,
    );
    expect(values).not.toHaveBeenCalled();
  });

  it('приглашение в админы не перевыпускается — через API админа не выпустить', async () => {
    const { service, values } = makeService(inviteRow({ role: USER_ROLE.ADMIN, createdBy: null }));
    expect(await rejectionCode(service.reissue(ADMIN, 'invite-id'))).toBe(API_ERROR_CODE.FORBIDDEN);
    expect(values).not.toHaveBeenCalled();
  });

  it('отозванное не перевыпускается', async () => {
    const { service } = makeService(inviteRow({ revokedAt: new Date(), revokedBy: ADMIN.id }));
    expect(await rejectionCode(service.reissue(ADMIN, 'invite-id'))).toBe(API_ERROR_CODE.FORBIDDEN);
  });
});
