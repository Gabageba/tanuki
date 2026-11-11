import 'dotenv/config';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const main = async () => {
  if (!process.env['DATABASE_URL']) throw new Error('DATABASE_URL обязателен');
  const client = postgres(process.env['DATABASE_URL'], { max: 1, connect_timeout: 5 });
  try {
    // max:1 pins this session-level lock and the Drizzle transaction to one connection.
    await client`SELECT pg_advisory_lock(7361952401)`;
    try {
      await migrate(drizzle(client), { migrationsFolder: resolve(process.cwd(), 'drizzle') });
    } finally {
      await client`SELECT pg_advisory_unlock(7361952401)`;
    }
  } finally {
    await client.end({ timeout: 5 });
  }
};

main().catch(() => {
  console.error('Миграция не выполнена. Проверьте БД и SQL-миграции; API не должен запускаться.');
  process.exitCode = 1;
});
