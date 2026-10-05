import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  INVITE_STATUS,
  INVITES_PAGE_SIZE,
  INVITES_SORT,
  SORT_DIRECTION,
  USER_ROLE,
  getInvitePermissions,
  type CreateInviteResponse,
  type Invite,
  type InvitableRole,
  type InvitePermissions,
  type InviteStatus,
  type InvitesQuery,
  type InvitesResponse,
  type InvitesSort,
  type SortDirection,
  type UserRole,
} from '@tanuki/contracts';
import { hashToken, generateToken } from '../common/token.util';
import {
  ApiException,
  ForbiddenApiException,
  InviteInvalidException,
  NotFoundApiException,
  StorageUnavailableException,
} from '../common/errors';
import type { SessionUser } from '../auth/session.service';
import { DatabaseService } from '../database/database.service';
import { invites, users } from '../database/schema';
import { INVITE_TTL_MS } from './models';
import { computeInviteStatus, toInvite } from './invites.mapper';

type InviteRow = typeof invites.$inferSelect;

const createdByUsers = alias(users, 'created_by_users');
const usedByUsers = alias(users, 'used_by_users');
const revokedByUsers = alias(users, 'revoked_by_users');

/** Повторяет computeInviteStatus в SQL: условия статусов взаимоисключающие. */
const statusCondition = (status: InviteStatus, now: Date): SQL | undefined => {
  switch (status) {
    case INVITE_STATUS.USED:
      return isNotNull(invites.usedAt);
    case INVITE_STATUS.REVOKED:
      return and(isNull(invites.usedAt), isNotNull(invites.revokedAt));
    case INVITE_STATUS.EXPIRED:
      return and(isNull(invites.usedAt), isNull(invites.revokedAt), lt(invites.expiresAt, now));
    case INVITE_STATUS.ACTIVE:
      return and(isNull(invites.usedAt), isNull(invites.revokedAt), gte(invites.expiresAt, now));
  }
};

/** Номер в порядке перечисления — для сортировки: статусы как в INVITE_STATUS (активные первыми),
 *  роли — от младшей к старшей. */
const rankOf = <Value extends string>(
  values: Value[],
  condition: (value: Value) => SQL | undefined,
) =>
  sql`case ${sql.join(
    values.map((value, index) => sql`when ${condition(value)} then ${sql.raw(String(index))}`),
    sql` `,
  )} end`;

const ROLE_ORDER: UserRole[] = [USER_ROLE.USER, USER_ROLE.MODERATOR, USER_ROLE.ADMIN];

/** Ключ сортировки; приглашения из консоли (без автора) — в конце при любом направлении. */
const sortExpression = (sort: InvitesSort, direction: SortDirection, now: Date): SQL => {
  const order = direction === SORT_DIRECTION.ASC ? asc : desc;
  switch (sort) {
    case INVITES_SORT.CREATED_AT:
      return order(invites.createdAt);
    case INVITES_SORT.STATUS:
      return order(rankOf(Object.values(INVITE_STATUS), (status) => statusCondition(status, now)));
    case INVITES_SORT.ROLE:
      return order(rankOf(ROLE_ORDER, (role) => eq(invites.role, role)));
    case INVITES_SORT.CREATED_BY:
      return sql`${order(sql`lower(${createdByUsers.username})`)} nulls last`;
  }
};

type PermissionKey = keyof InvitePermissions;

type InviteWithUsernames = {
  invite: InviteRow;
  createdByUsername: string | null;
  usedByUsername: string | null;
  usedByAvatarUpdatedAt: Date | null;
  revokedByUsername: string | null;
};

const toInviteWithUsernames = ({ invite, ...usernames }: InviteWithUsernames) =>
  toInvite(invite, usernames);

/** Права проверяются здесь, по getInvitePermissions из контрактов — интерфейс по той же функции
 *  только прячет недоступные кнопки. */
@Injectable()
export class InvitesService {
  constructor(private readonly database: DatabaseService) {}

  /** Модератор может выпускать инвайты только роли USER — роль MODERATOR доступна лишь админу. */
  async create(role: InvitableRole, actor: SessionUser): Promise<CreateInviteResponse> {
    if (actor.role === USER_ROLE.MODERATOR && role !== USER_ROLE.USER) {
      throw new ForbiddenApiException();
    }

    const code = generateToken(20);
    const row = await this.database.withFallback(async () => {
      const [inserted] = await this.database.db
        .insert(invites)
        .values(this.newInviteValues(code, role, actor))
        .returning();
      return inserted ?? null;
    }, null);

    if (!row) throw new StorageUnavailableException();
    return this.toCreated(row, actor, code);
  }

  async list({ page, status, role, sort, direction }: InvitesQuery): Promise<InvitesResponse> {
    const now = new Date();
    const where = and(
      status?.length ? or(...status.map((value) => statusCondition(value, now))) : undefined,
      role?.length ? inArray(invites.role, role) : undefined,
    );

    return this.database.withFallback(
      async () => {
        const [rows, [totalRow]] = await Promise.all([
          this.selectWithUsernames()
            .where(where)
            .orderBy(
              sortExpression(sort, direction, now),
              desc(invites.createdAt),
              desc(invites.id),
            )
            .limit(INVITES_PAGE_SIZE)
            .offset((page - 1) * INVITES_PAGE_SIZE),
          this.database.db.select({ total: count() }).from(invites).where(where),
        ]);
        return {
          items: rows.map(toInviteWithUsernames),
          total: totalRow?.total ?? 0,
        };
      },
      { items: [], total: 0 },
    );
  }

  async revoke(actor: SessionUser, id: string): Promise<Invite> {
    await this.assertAllowed(actor, id, 'canRevoke');
    await this.write(() =>
      this.database.db.update(invites).set(this.revokedValues(actor)).where(this.stillActive(id)),
    );
    return this.findOne(id);
  }

  /** Потерянную ссылку не восстановить — код хранится только хешем. Поэтому старое приглашение
   *  отзывается, а вместо него в той же транзакции выпускается новое с той же ролью. */
  async reissue(actor: SessionUser, id: string): Promise<CreateInviteResponse> {
    const old = await this.assertAllowed(actor, id, 'canReissue');
    // canReissue не пускает сюда приглашение в админы — роль заведомо из INVITABLE_ROLE.
    const role = old.role as InvitableRole;
    const code = generateToken(20);

    const row = await this.write(() =>
      this.database.db.transaction(async (tx) => {
        const revoked = await tx
          .update(invites)
          .set(this.revokedValues(actor))
          .where(this.stillActive(id))
          .returning({ id: invites.id });
        // Между проверкой и записью его успели использовать или отозвать.
        if (revoked.length === 0) throw new ForbiddenApiException();
        const [inserted] = await tx
          .insert(invites)
          .values(this.newInviteValues(code, role, actor))
          .returning();
        return inserted;
      }),
    );

    if (!row) throw new StorageUnavailableException();
    return this.toCreated(row, actor, code);
  }

  /** true, если код существует, ещё не использован, не отозван и не истёк. */
  async isValid(code: string): Promise<boolean> {
    const row = await this.findActive(code);
    return row !== null;
  }

  /**
   * Атомарно помечает инвайт использованным — WHERE-условие то же, что и у isValid, так что
   * гонка «два запроса с одним кодом одновременно» решается в пользу ровно одного из них:
   * второй запрос обновит 0 строк и получит InviteInvalidException.
   */
  async consume(code: string, userId: string): Promise<UserRole> {
    const invite = await this.findActive(code);
    if (!invite) throw new InviteInvalidException();

    const applied = await this.database.withFallback(async () => {
      const result = await this.database.db
        .update(invites)
        .set({ usedBy: userId, usedAt: new Date() })
        .where(
          and(
            eq(invites.id, invite.id),
            isNull(invites.usedAt),
            isNull(invites.revokedAt),
            gt(invites.expiresAt, new Date()),
          ),
        )
        .returning({ id: invites.id });
      return result.length > 0;
    }, false);

    if (!applied) throw new InviteInvalidException();
    return invite.role;
  }

  private async findActive(code: string): Promise<InviteRow | null> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(invites)
        .where(
          and(
            eq(invites.codeHash, hashToken(code)),
            isNull(invites.usedAt),
            isNull(invites.revokedAt),
            gt(invites.expiresAt, new Date()),
          ),
        )
        .limit(1);
      return row ?? null;
    }, null);
  }

  private async assertAllowed(
    actor: SessionUser,
    id: string,
    permission: PermissionKey,
  ): Promise<InviteRow> {
    const row = await this.database.withFallback(async () => {
      const [found] = await this.database.db
        .select()
        .from(invites)
        .where(eq(invites.id, id))
        .limit(1);
      return found ?? null;
    }, null);
    if (!row) throw new NotFoundApiException();
    const permissions = getInvitePermissions(actor, {
      status: computeInviteStatus(row),
      role: row.role,
      createdById: row.createdBy,
    });
    if (!permissions[permission]) throw new ForbiddenApiException();
    return row;
  }

  private async findOne(id: string): Promise<Invite> {
    const row = await this.database.withFallback(async () => {
      const [found] = await this.selectWithUsernames().where(eq(invites.id, id)).limit(1);
      return found ?? null;
    }, null);
    if (!row) throw new StorageUnavailableException();
    return toInviteWithUsernames(row);
  }

  private selectWithUsernames() {
    return this.database.db
      .select({
        invite: invites,
        createdByUsername: createdByUsers.username,
        usedByUsername: usedByUsers.username,
        usedByAvatarUpdatedAt: usedByUsers.avatarUpdatedAt,
        revokedByUsername: revokedByUsers.username,
      })
      .from(invites)
      .leftJoin(createdByUsers, eq(invites.createdBy, createdByUsers.id))
      .leftJoin(usedByUsers, eq(invites.usedBy, usedByUsers.id))
      .leftJoin(revokedByUsers, eq(invites.revokedBy, revokedByUsers.id))
      .$dynamic();
  }

  private stillActive(id: string) {
    return and(eq(invites.id, id), isNull(invites.usedAt), isNull(invites.revokedAt));
  }

  private revokedValues(actor: SessionUser) {
    return { revokedAt: new Date(), revokedBy: actor.id };
  }

  private newInviteValues(code: string, role: InvitableRole, actor: SessionUser) {
    return {
      codeHash: hashToken(code),
      role,
      createdBy: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    };
  }

  private toCreated(row: InviteRow, actor: SessionUser, code: string): CreateInviteResponse {
    return {
      ...toInvite(row, {
        createdByUsername: actor.username,
        usedByUsername: null,
        usedByAvatarUpdatedAt: null,
        revokedByUsername: null,
      }),
      code,
    };
  }

  private async write<Result>(operation: () => Promise<Result>): Promise<Result> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }
  }
}
