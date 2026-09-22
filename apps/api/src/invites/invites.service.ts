import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, gt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  USER_ROLE,
  type CreateInviteResponse,
  type Invite,
  type InvitableRole,
  type UserRole,
} from '@tanuki/contracts';
import { hashToken, generateToken } from '../common/token.util';
import {
  ForbiddenApiException,
  InviteInvalidException,
  StorageUnavailableException,
} from '../common/errors';
import type { SessionUser } from '../auth/session.service';
import { DatabaseService } from '../database/database.service';
import { invites, users } from '../database/schema';
import { INVITE_TTL_MS } from './models';
import { toInvite } from './invites.mapper';

type InviteRow = typeof invites.$inferSelect;

@Injectable()
export class InvitesService {
  constructor(private readonly database: DatabaseService) {}

  /** Модератор может выпускать инвайты только роли USER — роль MODERATOR доступна лишь админу. */
  async create(role: InvitableRole, actor: SessionUser): Promise<CreateInviteResponse> {
    if (actor.role === USER_ROLE.MODERATOR && role !== USER_ROLE.USER) {
      throw new ForbiddenApiException();
    }

    const code = generateToken(20);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const row = await this.database.withFallback(async () => {
      const [inserted] = await this.database.db
        .insert(invites)
        .values({ codeHash: hashToken(code), role, createdBy: actor.id, expiresAt })
        .returning();
      return inserted ?? null;
    }, null);

    if (!row) throw new StorageUnavailableException();

    const createdByUsername = await this.database.withFallback(
      async () => (await this.usernameOf(actor.id)) ?? null,
      null,
    );

    return { ...toInvite(row, createdByUsername, null), code };
  }

  async list(): Promise<Invite[]> {
    const createdByUsers = alias(users, 'created_by_users');
    const usedByUsers = alias(users, 'used_by_users');

    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select({
          invite: invites,
          createdByUsername: createdByUsers.username,
          usedByUsername: usedByUsers.username,
        })
        .from(invites)
        .leftJoin(createdByUsers, eq(invites.createdBy, createdByUsers.id))
        .leftJoin(usedByUsers, eq(invites.usedBy, usedByUsers.id))
        .orderBy(desc(invites.createdAt));

      return rows.map((row) =>
        toInvite(row.invite, row.createdByUsername ?? null, row.usedByUsername ?? null),
      );
    }, []);
  }

  async revoke(id: string): Promise<void> {
    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .update(invites)
        .set({ revokedAt: new Date() })
        .where(and(eq(invites.id, id), isNull(invites.usedAt), isNull(invites.revokedAt)));
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
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

  private async usernameOf(userId: string): Promise<string | null> {
    const [row] = await this.database.db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.username ?? null;
  }
}
