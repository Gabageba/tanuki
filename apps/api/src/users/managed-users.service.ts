import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  not,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  MANAGED_USERS_PAGE_SIZE,
  MANAGED_USERS_SORT,
  SORT_DIRECTION,
  USER_STATUS,
  getUserManagementPermissions,
  type BlockUserRequest,
  type InvitableRole,
  type ManagedUser,
  type ManagedUsersQuery,
  type ManagedUsersResponse,
  type ManagedUsersSort,
  type SortDirection,
  type UserManagementPermissions,
  type UserStatus,
} from '@tanuki/contracts';
import {
  ApiException,
  BadRequestApiException,
  ForbiddenApiException,
  NotFoundApiException,
  StorageUnavailableException,
} from '../common/errors';
import { SessionService, type SessionUser } from '../auth/session.service';
import { DatabaseService } from '../database/database.service';
import { invites, users } from '../database/schema';
import { toManagedUser } from './managed-users.mapper';

const inviters = alias(users, 'inviters');

/** `%` и `_` в поиске — обычные символы, а не шаблоны ILIKE. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Действующая блокировка — то же условие, что и isUserBlocked, только в SQL. */
const blockedCondition = (now: Date) =>
  and(isNotNull(users.blockedAt), or(isNull(users.blockedUntil), gt(users.blockedUntil, now)));

/** Повторяет приоритет computeUserStatus: каждый статус исключает те, что стоят выше. */
const statusCondition = (status: UserStatus, now: Date): SQL | undefined => {
  // NULL сюда не просачивается: isNull/isNotNull всегда дают true или false.
  const notBlocked = not(blockedCondition(now) as SQL);
  switch (status) {
    case USER_STATUS.BLOCKED:
      return blockedCondition(now);
    case USER_STATUS.DELETION_SCHEDULED:
      return and(notBlocked, isNotNull(users.deletionScheduledAt));
    case USER_STATUS.UNVERIFIED:
      return and(notBlocked, isNull(users.deletionScheduledAt), isNull(users.emailVerifiedAt));
    case USER_STATUS.ACTIVE:
      return and(notBlocked, isNull(users.deletionScheduledAt), isNotNull(users.emailVerifiedAt));
  }
};

/** Номер статуса в порядке USER_STATUS — для сортировки; условия статусов взаимоисключающие. */
const statusRank = (now: Date) =>
  sql`case ${sql.join(
    Object.values(USER_STATUS).map(
      (status, index) => sql`when ${statusCondition(status, now)} then ${sql.raw(String(index))}`,
    ),
    sql` `,
  )} end`;

/** Ключ сортировки; без пригласившего — в конце при любом направлении. */
const sortExpression = (sort: ManagedUsersSort, direction: SortDirection, now: Date): SQL => {
  const order = direction === SORT_DIRECTION.ASC ? asc : desc;
  switch (sort) {
    case MANAGED_USERS_SORT.USERNAME:
      return order(sql`lower(${users.username})`);
    case MANAGED_USERS_SORT.STATUS:
      return order(statusRank(now));
    case MANAGED_USERS_SORT.INVITED_BY:
      return sql`${order(sql`lower(${inviters.username})`)} nulls last`;
    case MANAGED_USERS_SORT.CREATED_AT:
      return order(users.createdAt);
  }
};

type PermissionKey = keyof UserManagementPermissions;

/**
 * «Управление» → «Пользователи». Права проверяются здесь, по getUserManagementPermissions из
 * контрактов — интерфейс по той же функции только прячет недоступные кнопки.
 */
@Injectable()
export class ManagedUsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly sessionService: SessionService,
  ) {}

  async list({
    page,
    query,
    role,
    status,
    sort,
    direction,
  }: ManagedUsersQuery): Promise<ManagedUsersResponse> {
    const now = new Date();
    const needle = query ? `%${escapeLike(query)}%` : null;
    const where = and(
      role?.length ? inArray(users.role, role) : undefined,
      status?.length ? or(...status.map((value) => statusCondition(value, now))) : undefined,
      needle ? or(ilike(users.username, needle), ilike(users.email, needle)) : undefined,
    );

    return this.database.withFallback(
      async () => {
        const [rows, [totalRow]] = await Promise.all([
          this.selectWithInviter()
            .where(where)
            .orderBy(sortExpression(sort, direction, now), desc(users.createdAt), desc(users.id))
            .limit(MANAGED_USERS_PAGE_SIZE)
            .offset((page - 1) * MANAGED_USERS_PAGE_SIZE),
          this.database.db.select({ total: count() }).from(users).where(where),
        ]);
        return {
          items: rows.map((row) => toManagedUser(row.user, row.invitedByUsername ?? null)),
          total: totalRow?.total ?? 0,
        };
      },
      { items: [], total: 0 },
    );
  }

  async changeRole(actor: SessionUser, id: string, role: InvitableRole): Promise<ManagedUser> {
    await this.assertAllowed(actor, id, 'canChangeRole');
    await this.write(() => this.database.db.update(users).set({ role }).where(eq(users.id, id)));
    return this.findOne(id);
  }

  /** Заблокированный выходит сразу на всех устройствах — его сессии удаляются тем же запросом. */
  async block(
    actor: SessionUser,
    id: string,
    { until, reason }: BlockUserRequest,
  ): Promise<ManagedUser> {
    await this.assertAllowed(actor, id, 'canBlock');
    const blockedUntil = until ? new Date(until) : null;
    if (blockedUntil && blockedUntil.getTime() <= Date.now()) throw new BadRequestApiException();

    await this.write(() =>
      this.database.db
        .update(users)
        .set({ blockedAt: new Date(), blockedUntil, blockReason: reason || null })
        .where(eq(users.id, id)),
    );
    await this.sessionService.revokeAllForUser(id);
    return this.findOne(id);
  }

  async unblock(actor: SessionUser, id: string): Promise<ManagedUser> {
    await this.assertAllowed(actor, id, 'canBlock');
    await this.write(() =>
      this.database.db
        .update(users)
        .set({ blockedAt: null, blockedUntil: null, blockReason: null })
        .where(eq(users.id, id)),
    );
    return this.findOne(id);
  }

  /**
   * Сразу и без отсрочки — отсрочка есть только у удаления, которое человек запросил сам. Всё его
   * уходит каскадом, инвайты остаются без ссылки на него (как в AuthCleanupService).
   */
  async delete(actor: SessionUser, id: string): Promise<void> {
    await this.assertAllowed(actor, id, 'canDelete');
    await this.write(() => this.database.db.delete(users).where(eq(users.id, id)));
  }

  private async assertAllowed(
    actor: SessionUser,
    id: string,
    permission: PermissionKey,
  ): Promise<void> {
    const target = await this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return row ?? null;
    }, null);
    if (!target) throw new NotFoundApiException();
    if (!getUserManagementPermissions(actor, target)[permission]) throw new ForbiddenApiException();
  }

  private async findOne(id: string): Promise<ManagedUser> {
    const row = await this.database.withFallback(async () => {
      const [found] = await this.selectWithInviter().where(eq(users.id, id)).limit(1);
      return found ?? null;
    }, null);
    if (!row) throw new StorageUnavailableException();
    return toManagedUser(row.user, row.invitedByUsername ?? null);
  }

  /** «Пригласил» — автор инвайта, которым человек зарегистрировался. */
  private selectWithInviter() {
    return this.database.db
      .select({ user: users, invitedByUsername: inviters.username })
      .from(users)
      .leftJoin(invites, eq(invites.usedBy, users.id))
      .leftJoin(inviters, eq(invites.createdBy, inviters.id))
      .$dynamic();
  }

  private async write(operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }
  }
}
