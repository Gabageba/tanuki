import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { describe, expect, it } from 'vitest';
import { DEFAULT_READER_SETTINGS } from '@tanuki/contracts';

const DATABASE_URL = process.env['READER_MIGRATION_TEST_DATABASE_URL'];

// Opt in against a local PostgreSQL. Every write targets a connection-local temporary table.
// No application table or migration journal is touched.
describe.skipIf(!DATABASE_URL)('reader settings migration', () => {
  it('добавляет умолчания существующей строке и новым строкам', async () => {
    const connection = postgres(DATABASE_URL!, { max: 1 });
    try {
      await connection.begin(async (tx) => {
        await tx`CREATE TEMPORARY TABLE reader_settings (user_id text PRIMARY KEY) ON COMMIT DROP`;
        await tx`INSERT INTO reader_settings VALUES ('existing')`;
        for (const file of ['0034_reader_improvements.sql', '0035_reader_theme_background.sql']) {
          const migration = readFileSync(resolve('drizzle', file), 'utf8');
          for (const statement of migration.split('--> statement-breakpoint'))
            await tx.unsafe(statement);
        }
        await tx`INSERT INTO reader_settings (user_id) VALUES ('new')`;
        const rows =
          await tx`SELECT direction, page_layout AS "pageLayout", brightness, prefetch_pages AS "prefetchPages", keep_screen_on AS "keepScreenOn" FROM reader_settings`;
        const { direction, pageLayout, brightness, prefetchPages, keepScreenOn } =
          DEFAULT_READER_SETTINGS;
        expect(rows).toHaveLength(2);
        rows.forEach((row) =>
          expect(row).toEqual({
            direction,
            pageLayout,
            brightness,
            prefetchPages,
            keepScreenOn,
          }),
        );
        const columns = await tx`
          SELECT attname FROM pg_attribute
          WHERE attrelid = 'pg_temp.reader_settings'::regclass
            AND attname = 'background' AND NOT attisdropped
        `;
        expect(columns).toHaveLength(0);
      });
    } finally {
      await connection.end();
    }
  });
});
