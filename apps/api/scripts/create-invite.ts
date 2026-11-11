/**
 * Печатает инвайт роли admin — единственный способ попасть за закрытую регистрацию, пока в базе
 * нет ни одного пользователя (createdBy у него остаётся null, см. database/schema.ts). Админ в
 * системе может быть только один, поэтому скрипт отказывается работать, если он уже существует.
 * Инвайты ролей moderator и user выпускает вкладка «Приглашения» на странице «Управление» от
 * имени залогиненного админа или модератора.
 *
 * Usage: pnpm --filter @tanuki/api invite:create
 */
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { USER_ROLE } from '@tanuki/contracts';
import { invites, users } from '../src/database/schema';

loadDotenv({ path: resolve(__dirname, '../.env'), quiet: true });

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const main = async () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://tanuki:tanuki@localhost:5432/tanuki';
  const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';

  const client = postgres(databaseUrl, { max: 1, connect_timeout: 5 });
  const db = drizzle(client);
  try {
    await client`SELECT pg_advisory_lock(7361952402)`;

    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, USER_ROLE.ADMIN))
      .limit(1);
    if (existingAdmin) {
      throw new Error('Админ уже существует — повторно создать его нельзя.');
    }

    const code = randomBytes(20).toString('base64url');
    const codeHash = createHash('sha256').update(code).digest('hex');

    await db.insert(invites).values({
      codeHash,
      role: USER_ROLE.ADMIN,
      createdBy: null,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    console.log('Инвайт (admin) создан, действует 7 дней:');
    console.log(`${appUrl}/register?invite=${code}`);
  } finally {
    await client.end({ timeout: 5 });
  }
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error && error.message.startsWith('Админ уже')
      ? error.message
      : 'Не удалось создать приглашение. Проверьте DATABASE_URL и миграции.',
  );
  process.exit(1);
});
