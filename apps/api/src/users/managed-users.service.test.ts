import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import {
  API_ERROR_CODE,
  MANAGED_USERS_SORT,
  SORT_DIRECTION,
  USER_ROLE,
  type ManagedUsersSort,
  type SortDirection,
  type UserRole,
} from '@tanuki/contracts';
import type { SessionService, SessionUser } from '../auth/session.service';
import type { DatabaseService } from '../database/database.service';
import { ManagedUsersService, sortExpression } from './managed-users.service';

const DAY_MS = 24 * 60 * 60 * 1000;

type Target = { id: string; role: UserRole };

/** База, которая знает одного пользователя — ровно то, что сервис читает до проверки прав. */
const makeService = (target: Target | null) => {
  const remove = vi.fn(() => ({ where: async () => undefined }));
  const query = {
    select: () => query,
    from: () => query,
    where: () => query,
    limit: async () => (target ? [target] : []),
  };
  const database = {
    db: { ...query, delete: remove },
    withFallback: <T>(operation: () => Promise<T>) => operation(),
  } as unknown as DatabaseService;
  const sessionService = { revokeAllForUser: vi.fn() } as unknown as SessionService;
  return { service: new ManagedUsersService(database, sessionService), remove };
};

const actor = (role: UserRole, id = `${role}-id`) => ({ id, role }) as SessionUser;

const ADMIN = actor(USER_ROLE.ADMIN);
const MODERATOR = actor(USER_ROLE.MODERATOR);
const USER_TARGET: Target = { id: 'user-id', role: USER_ROLE.USER };
const MODERATOR_TARGET: Target = { id: 'other-moderator-id', role: USER_ROLE.MODERATOR };

const rejectionCode = async (action: Promise<unknown>) => {
  try {
    await action;
    return null;
  } catch (error) {
    return (error as { code?: string }).code;
  }
};

describe('ManagedUsersService — права', () => {
  it('модератор не меняет роли', async () => {
    const { service } = makeService(USER_TARGET);
    expect(
      await rejectionCode(service.changeRole(MODERATOR, USER_TARGET.id, USER_ROLE.MODERATOR)),
    ).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('модератор не блокирует другого модератора', async () => {
    const { service } = makeService(MODERATOR_TARGET);
    expect(
      await rejectionCode(
        service.block(MODERATOR, MODERATOR_TARGET.id, { until: null, reason: null }),
      ),
    ).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('модератор не удаляет', async () => {
    const { service, remove } = makeService(USER_TARGET);
    expect(await rejectionCode(service.delete(MODERATOR, USER_TARGET.id))).toBe(
      API_ERROR_CODE.FORBIDDEN,
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('админа не трогает никто, даже другой админ', async () => {
    const target: Target = { id: 'admin-2', role: USER_ROLE.ADMIN };
    const { service } = makeService(target);
    expect(await rejectionCode(service.unblock(ADMIN, target.id))).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('себя не трогает никто', async () => {
    const { service } = makeService({ id: ADMIN.id, role: USER_ROLE.ADMIN });
    expect(await rejectionCode(service.delete(ADMIN, ADMIN.id))).toBe(API_ERROR_CODE.FORBIDDEN);
  });

  it('несуществующий пользователь — 404', async () => {
    const { service } = makeService(null);
    expect(await rejectionCode(service.delete(ADMIN, 'missing'))).toBe(API_ERROR_CODE.NOT_FOUND);
  });

  it('срок блокировки в прошлом отвергается', async () => {
    const { service } = makeService(USER_TARGET);
    const until = new Date(Date.now() - DAY_MS).toISOString();
    expect(
      await rejectionCode(service.block(MODERATOR, USER_TARGET.id, { until, reason: null })),
    ).toBe(API_ERROR_CODE.BAD_REQUEST);
  });

  it('админ удаляет обычного пользователя', async () => {
    const { service, remove } = makeService(USER_TARGET);
    expect(await rejectionCode(service.delete(ADMIN, USER_TARGET.id))).toBeNull();
    expect(remove).toHaveBeenCalledOnce();
  });
});

const DIALECT = new PgDialect();

const orderBy = (sort: ManagedUsersSort, direction: SortDirection) =>
  DIALECT.sqlToQuery(sortExpression(sort, direction, new Date())).sql.toLowerCase();

describe('ManagedUsersService — сортировка', () => {
  it('почта — без учёта регистра', () => {
    expect(orderBy(MANAGED_USERS_SORT.EMAIL, SORT_DIRECTION.ASC)).toContain(
      'lower("users"."email")',
    );
  });

  it.each([MANAGED_USERS_SORT.STATUS_UNTIL, MANAGED_USERS_SORT.LAST_SEEN_AT])(
    '%s — пустые в конце при любом направлении',
    (sort) => {
      expect(orderBy(sort, SORT_DIRECTION.ASC)).toMatch(/ asc nulls last$/);
      expect(orderBy(sort, SORT_DIRECTION.DESC)).toMatch(/ desc nulls last$/);
    },
  );

  it('срок: бессрочная блокировка — самая дальняя, удаление — своей датой', () => {
    const query = orderBy(MANAGED_USERS_SORT.STATUS_UNTIL, SORT_DIRECTION.ASC);
    expect(query).toContain(`coalesce("users"."blocked_until", 'infinity'::timestamptz)`);
    expect(query).toContain('then "users"."deletion_scheduled_at"');
  });
});
