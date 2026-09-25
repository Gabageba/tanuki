import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import {
  InvalidImageException,
  StorageUnavailableException,
  UsernameTakenException,
} from '../common/errors';
import type { SessionUser } from '../auth/session.service';
import { DatabaseService } from '../database/database.service';
import { getUniqueViolation } from '../database/pg-error.util';
import { userAvatars, users } from '../database/schema';
import { AVATAR_QUALITY, AVATAR_SIZE_PX } from './models';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async updateUsername(userId: string, username: string): Promise<SessionUser> {
    try {
      const [user] = await this.database.db
        .update(users)
        .set({ username })
        .where(eq(users.id, userId))
        .returning();
      if (!user) throw new StorageUnavailableException();
      return user;
    } catch (error) {
      if (getUniqueViolation(error) === 'users_username_lower_idx') {
        throw new UsernameTakenException();
      }
      throw new StorageUnavailableException();
    }
  }

  /**
   * Исходник не хранится: он может весить мегабайты и нести EXIF с геометкой. Сохраняется только
   * квадратный webp — rotate() до ресайза применяет ориентацию из EXIF, а сам EXIF отбрасывается.
   */
  async updateAvatar(userId: string, raw: Buffer): Promise<SessionUser> {
    let data: Buffer;
    try {
      data = await sharp(raw)
        .rotate()
        .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: 'cover' })
        .webp({ quality: AVATAR_QUALITY })
        .toBuffer();
    } catch {
      throw new InvalidImageException();
    }

    const updatedAt = new Date();
    try {
      return await this.database.db.transaction(async (tx) => {
        await tx
          .insert(userAvatars)
          .values({ userId, data, updatedAt })
          .onConflictDoUpdate({ target: userAvatars.userId, set: { data, updatedAt } });
        const [user] = await tx
          .update(users)
          .set({ avatarUpdatedAt: updatedAt })
          .where(eq(users.id, userId))
          .returning();
        if (!user) throw new StorageUnavailableException();
        return user;
      });
    } catch {
      throw new StorageUnavailableException();
    }
  }

  async deleteAvatar(userId: string): Promise<SessionUser> {
    try {
      return await this.database.db.transaction(async (tx) => {
        await tx.delete(userAvatars).where(eq(userAvatars.userId, userId));
        const [user] = await tx
          .update(users)
          .set({ avatarUpdatedAt: null })
          .where(eq(users.id, userId))
          .returning();
        if (!user) throw new StorageUnavailableException();
        return user;
      });
    } catch {
      throw new StorageUnavailableException();
    }
  }

  async getAvatar(userId: string): Promise<Buffer | null> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select({ data: userAvatars.data })
        .from(userAvatars)
        .where(eq(userAvatars.userId, userId))
        .limit(1);
      return row?.data ?? null;
    }, null);
  }
}
