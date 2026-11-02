import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { describe, expect, it } from 'vitest';

const DATABASE_URL = process.env['SOURCE_ACCOUNT_MIGRATION_TEST_DATABASE_URL'];

// Opt in against a local PostgreSQL. All writes target a connection-local temporary table.
describe.skipIf(!DATABASE_URL)('inuko account migration', () => {
  it('переносит inkstory, сохраняет существующий inuko и остальные семейства', async () => {
    const connection = postgres(DATABASE_URL!, { max: 1 });
    try {
      await connection.begin(async (tx) => {
        await tx`CREATE TEMPORARY TABLE source_accounts (LIKE public.source_accounts INCLUDING ALL) ON COMMIT DROP`;
        await tx`
          INSERT INTO source_accounts (user_id, family, status, login, encrypted_state)
          VALUES
            ('00000000-0000-4000-8000-000000000001', 'inkstory', 'active', 'legacy only', 'legacy state'),
            ('00000000-0000-4000-8000-000000000002', 'inkstory', 'reloginRequired', 'legacy duplicate', 'old state'),
            ('00000000-0000-4000-8000-000000000002', 'inuko', 'active', 'new account', 'new state'),
            ('00000000-0000-4000-8000-000000000003', 'inuko', 'active', 'inuko only', 'existing state'),
            ('00000000-0000-4000-8000-000000000001', 'remanga', 'active', 'other family', 'other state')
        `;
        const before = await tx`SELECT * FROM source_accounts ORDER BY user_id, family`;
        const expected = before
          .filter((row) => row['login'] !== 'legacy duplicate')
          .map((row) => ({
            ...row,
            family: row['family'] === 'inkstory' ? 'inuko' : row['family'],
          }));
        const migration = readFileSync(resolve('drizzle/0032_inuko_family.sql'), 'utf8');
        const statements = migration.split('--> statement-breakpoint');
        for (const statement of statements) await tx.unsafe(statement);
        const after = await tx`SELECT * FROM source_accounts ORDER BY user_id, family`;
        expect([...after]).toEqual(expected);

        // A repeated run must preserve the migrated accounts too.
        for (const statement of statements) await tx.unsafe(statement);
        const repeated = await tx`SELECT * FROM source_accounts ORDER BY user_id, family`;
        expect([...repeated]).toEqual(expected);
      });
    } finally {
      await connection.end();
    }
  });
});
