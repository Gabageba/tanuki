import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import * as schema from '../database/schema';
import { TitleLinksService } from './title-links.service';

// Только отдельная тестовая БД: исходная база по этому адресу не меняется.
const TEST_URL = process.env['TITLE_LINKS_TEST_DATABASE_URL'];
const DATABASE_NAME = `title_links_test_${randomUUID().replaceAll('-', '')}`;

describe.skipIf(!TEST_URL)('отклонение связи во всей группе — PostgreSQL', () => {
  const admin = postgres(TEST_URL ?? '', { onnotice: () => {} });
  const client = postgres(TEST_URL ?? '', { database: DATABASE_NAME, onnotice: () => {} });
  const db = drizzle(client, { schema });
  const service = new TitleLinksService({
    db,
    withFallback: async <T>(operation: () => Promise<T>, fallback: T) => {
      try {
        return await operation();
      } catch {
        return fallback;
      }
    },
  } as unknown as DatabaseService);
  const set = (from: string, to: string, verdict: TitleLinkVerdict) =>
    service.set(from, `Название ${from}`, to, `Название ${to}`, verdict);
  const confirm = (from: string, to: string) => set(from, to, TITLE_LINK_VERDICT.CONFIRMED);
  const reject = (from: string, to: string) => set(from, to, TITLE_LINK_VERDICT.REJECTED);
  const expectGroups = async (...groups: string[][]) => {
    const canonical = await service.listCanonicalKeys(groups.flat());
    for (const group of groups) {
      for (const key of group) {
        const others = group.filter((member) => member !== key).sort();
        expect((await service.listGroup(key)).sort()).toEqual(others);
        expect((await service.listConfirmedGroup(key)).sort()).toEqual(others);
        expect(canonical.get(key)).toBe([...group].sort()[0]);
      }
    }
  };

  beforeAll(async () => {
    await admin.unsafe(`CREATE DATABASE "${DATABASE_NAME}"`);
    for (const migration of ['0000_charming_jack_murdock.sql', '0002_wonderful_shen.sql']) {
      const sql = await readFile(resolve('drizzle', migration), 'utf8');
      for (const statement of sql.split('--> statement-breakpoint')) {
        if (statement.trim()) await client.unsafe(statement);
      }
    }
  });
  beforeEach(async () => {
    await db.delete(schema.titleLinks);
  });
  afterAll(async () => {
    await client.end();
    await admin.unsafe(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`);
    await admin.end();
  });

  it('исключает конец цепочки из всех её тайтлов и скрывает его из совпадений', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await reject('a', 'c');

    await expectGroups(['a', 'b'], ['c']);
    for (const key of ['a', 'b']) {
      expect(await service.listFor(key)).toContainEqual({
        targetId: 'c',
        targetName: 'Название c',
        verdict: TITLE_LINK_VERDICT.REJECTED,
      });
    }
  });

  it('сохраняет остальные тайтлы вместе при исключении середины цепочки', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await confirm('c', 'd');
    await reject('a', 'b');

    await expectGroups(['a', 'c', 'd'], ['b']);
  });

  it('разрывает все пути в кольце, в том числе при обратном порядке ключей', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await confirm('a', 'c');
    await reject('c', 'a');

    await expectGroups(['b', 'c'], ['a']);
  });

  it('повторный отказ и последовательный отказ от нескольких тайтлов сохраняют группу', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await confirm('c', 'd');
    await reject('a', 'b');
    await reject('a', 'b');
    await reject('a', 'c');

    await expectGroups(['a', 'd'], ['b'], ['c']);
  });

  it('отказ от внешнего совпадения распространяется на группу, сохраняя группу цели', async () => {
    await confirm('a', 'b');
    await confirm('c', 'd');
    await reject('a', 'c');

    await expectGroups(['a', 'b'], ['c', 'd']);
    expect(await service.listFor('b')).toContainEqual({
      targetId: 'c',
      targetName: 'Название c',
      verdict: TITLE_LINK_VERDICT.REJECTED,
    });
  });

  it('одновременные отказы не возвращают исключённые тайтлы в группу', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await confirm('c', 'd');
    await Promise.all([reject('a', 'b'), reject('a', 'c')]);

    await expectGroups(['a', 'd'], ['b'], ['c']);
  });

  it('исправляет старый отказ одной пары, не перезаписывая другие явные отказы', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    await confirm('c', 'd');
    await db.insert(schema.titleLinks).values({
      aId: 'a',
      bId: 'c',
      aName: 'Название a',
      bName: 'Название c',
      verdict: TITLE_LINK_VERDICT.REJECTED,
    });
    await reject('a', 'b');

    expect((await service.listGroup('b')).sort()).toEqual([]);
    expect((await service.listConfirmedGroup('a')).sort()).toEqual(['d']);
    expect(await service.listFor('a')).toContainEqual({
      targetId: 'c',
      targetName: 'Название c',
      verdict: TITLE_LINK_VERDICT.REJECTED,
    });
  });

  it('откатывает всю правку при ошибке записи', async () => {
    await confirm('a', 'b');
    await confirm('b', 'c');
    const before = await db.select().from(schema.titleLinks);
    await client`ALTER TABLE title_links ADD CONSTRAINT fail_rejection CHECK (verdict <> 'rejected')`;
    try {
      await expect(reject('a', 'b')).rejects.toThrow('Хранилище недоступно');
      expect(await db.select().from(schema.titleLinks)).toEqual(before);
    } finally {
      await client`ALTER TABLE title_links DROP CONSTRAINT fail_rejection`;
    }
  });
});
