import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BOOKMARK_SORT,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  DEFAULT_BRANCH_ID,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_STATUS,
  TITLE_TYPE,
  type Backup,
} from '@tanuki/contracts';
import * as schema from '../database/schema';
import type { DatabaseService } from '../database/database.service';
import type { Env } from '../config/env';
import { titleIdOf, normalizeChapter } from '../common/normalize';
import type { RawTitle, RawChapter } from '../parsers-client/parsers-client.types';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { SourcesService } from '../sources/sources.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { AdultContentService } from '../adult-content/adult-content.service';
import { BackupRestoreService } from '../backup/backup-restore.service';
import { BackupExportService } from '../backup/backup-export.service';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import { BookmarksService } from './bookmarks.service';
import { BookmarkFoldersService } from './bookmark-folders.service';
import { LibraryMergeService } from './library-merge.service';
import { SourceImportService } from '../source-import/source-import.service';
import { SourceImportProgressService } from '../source-import/source-import-progress.service';
import { SOURCE_IMPORT_PROGRESS_STATUS } from '@tanuki/contracts';
import { TitleSnapshotsService } from './title-snapshots.service';
import { TITLE_SNAPSHOT_ORIGIN } from './models';
import {
  hydrateBookmarks,
  lockSnapshotLifecycle,
  resolveTitleSnapshots,
  writeTitleFallbacks,
} from './title-snapshot-storage';

// Опциональный адрес PostgreSQL с CREATE DATABASE. Рабочая БД не меняется: создаём отдельную,
// применяем настоящие миграции, а по окончании удаляем только созданную здесь базу.
const TEST_URL = process.env['SNAPSHOT_TEST_DATABASE_URL'];
const DATABASE_NAME = `snapshot_test_${randomUUID().replaceAll('-', '')}`;
const USER_A = '00000000-0000-4000-8000-000000000001';
const USER_B = '00000000-0000-4000-8000-000000000002';
const ENV = { APP_URL: 'https://tanuki.test', IMG_SIGN_SECRET: 'snapshot-integration-test' } as Env;
const KEY = 'remanga:/title';
const at = (minutes: number) => new Date(Date.UTC(2026, 10, 1, 0, minutes));
const chapter = (id: number, isPaid = false): RawChapter => ({
  id,
  url: `/chapter/${id}`,
  number: id,
  volume: null,
  title: null,
  branch: null,
  uploadDate: 0,
  scanlator: null,
  source: 'remanga',
  isPaid,
});
const title = (overrides: Partial<RawTitle> = {}): RawTitle =>
  ({
    id: 1,
    url: '/title',
    title: 'Название источника',
    coverUrl: 'https://remanga.org/cover.jpg',
    contentRating: CONTENT_RATING.SAFE,
    chapters: null,
    ...overrides,
  }) as RawTitle;
const personal = (userId: string, name: string) => ({
  userId,
  titleKey: KEY,
  titleId: titleIdOf('remanga', title()),
  name,
  coverUrl: 'https://attacker.test/cover.jpg',
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  updatedAt: at(1),
});
const mark = (userId: string, titleKey = KEY) => ({
  userId,
  titleKey,
  sourceId: 'remanga',
  chapterId: normalizeChapter('remanga', '', chapter(1)).id,
  chapterVolume: null,
  chapterNumber: 1,
  chapterTitle: null,
  branchId: DEFAULT_BRANCH_ID,
  pageIndex: 4,
  updatedAt: at(1),
});
const deferred = () => {
  let complete = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    complete = resolvePromise;
  });
  return { promise, complete };
};

describe.skipIf(!TEST_URL)('shared title snapshot — PostgreSQL', () => {
  const options = {
    max: 8,
    onnotice: () => {},
    ...(process.env['SNAPSHOT_TEST_PG_SOCKET']
      ? { host: process.env['SNAPSHOT_TEST_PG_SOCKET'] }
      : {}),
  };
  const admin = postgres(TEST_URL ?? '', options);
  const client = postgres(TEST_URL ?? '', { ...options, database: DATABASE_NAME });
  const db = drizzle(client, { schema });
  const database = {
    db,
    withFallback: <T>(operation: () => Promise<T>) => operation(),
  } as unknown as DatabaseService;
  const links = {
    listCanonicalKeys: vi.fn(async (keys: string[]) => new Map(keys.map((key) => [key, key]))),
    listConfirmedGroup: vi.fn(async () => [] as string[]),
  } as unknown as TitleLinksService;
  const notifications = {
    removeNewChapters: vi.fn(async () => {}),
  } as unknown as NotificationsService;
  const parsers = {
    getDetails: vi.fn(async () => {
      throw new Error('source offline');
    }),
  };
  const sources = {
    listSources: async () =>
      ['remanga', 'mangalib'].map((id) => ({ id, isEnabled: true, status: SOURCE_STATUS.OK })),
  } as SourcesService;
  const folders = new BookmarkFoldersService(database, links, notifications);
  const snapshots = new TitleSnapshotsService(database);
  const merge = new LibraryMergeService(snapshots);
  const bookmarks = new BookmarksService(
    ENV,
    database,
    folders,
    links,
    snapshots,
    sources,
    parsers as unknown as ParsersClientService,
    notifications,
  );
  const progress = new ReadingProgressService(
    ENV,
    database,
    links,
    parsers as unknown as ParsersClientService,
    {} as AdultContentService,
    bookmarks,
    sources,
    snapshots,
  );
  const exporter = new BackupExportService(ENV, database, folders);
  const restorer = new BackupRestoreService(database, folders, links, notifications, merge);
  let migration: {
    fallbacks: (typeof schema.USER_TITLE_SNAPSHOT_FALLBACKS.$inferSelect)[];
    snapshots: (typeof schema.titleChapterSnapshots.$inferSelect)[];
    progress: (typeof schema.readingProgress.$inferSelect)[];
    columns: string[];
    seen: (typeof schema.titleChaptersSeen.$inferSelect)[];
  };
  const folder = async (userId: string) =>
    (await folders.list(userId)).find(
      ({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.PLANNED,
    )!;
  const insertBookmark = async (userId: string) =>
    db
      .insert(schema.bookmarks)
      .values({ userId, titleKey: KEY, sourceId: 'remanga', folderId: (await folder(userId)).id });
  const shared = async () =>
    (
      await db
        .select()
        .from(schema.titleChapterSnapshots)
        .where(eq(schema.titleChapterSnapshots.titleKey, KEY))
    )[0]!;

  beforeAll(async () => {
    await admin.unsafe(`CREATE DATABASE "${DATABASE_NAME}"`);
    const migrationDir = resolve('drizzle');
    const files = (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files.filter((file) => !file.startsWith('0036_'))) {
      for (const statement of (await readFile(resolve(migrationDir, file), 'utf8')).split(
        '--> statement-breakpoint',
      )) {
        if (statement.trim()) await client.unsafe(statement);
      }
    }
    await client`INSERT INTO users (id, email, username, password_hash, role, language) VALUES
      (${USER_A}, 'a@test', 'a', 'hash', 'user', 'ru'), (${USER_B}, 'b@test', 'b', 'hash', 'user', 'ru')`;
    const [f] =
      await client`INSERT INTO bookmark_folders (user_id, built_in, position, track_updates)
      VALUES (${USER_A}, 'planned', 0, true) RETURNING id`;
    await client`INSERT INTO bookmarks (user_id, title_key, source_id, title_id, folder_id, name, content_rating, updated_at)
      VALUES (${USER_A}, ${KEY}, 'remanga', 'old-id', ${f!.id}, 'Закладка', 'adult', ${at(2).toISOString()})`;
    await client`INSERT INTO reading_progress (user_id, title_key, source_id, chapter_id, branch_id, page_index, title_id, title_name, hidden_at, updated_at)
      VALUES (${USER_A}, ${KEY}, 'remanga', 'chapter', 'default', 7, 'progress-id', 'Равное время', ${at(1).toISOString()}, ${at(2).toISOString()}),
      (${USER_B}, ${KEY}, 'remanga', 'chapter', 'default', 9, 'other-id', 'Чужая версия', null, ${at(3).toISOString()}),
      (${USER_B}, 'remanga:/nullable', 'remanga', 'chapter', 'default', 0, null, null, null, ${at(1).toISOString()})`;
    await client`INSERT INTO title_chapter_snapshots (title_key, source_id, title_id, chapters_count, missing) VALUES
      (${KEY}, 'remanga', 'old-id', null, false), ('remanga:/zero', 'remanga', 'zero', 0, false),
      ('remanga:/failed', 'remanga', 'failed', null, true)`;
    await client`INSERT INTO title_chapters_seen (title_key, chapter_id, branch_id, baseline, first_seen_at)
      VALUES (${KEY}, 'chapter', 'default', true, ${at(0).toISOString()})`;
    for (const statement of (
      await readFile(
        resolve(
          migrationDir,
          files.find((file) => file.startsWith('0036_'))!,
        ),
        'utf8',
      )
    ).split('--> statement-breakpoint')) {
      if (statement.trim()) await client.unsafe(statement);
    }
    migration = {
      fallbacks: await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS),
      snapshots: await db.select().from(schema.titleChapterSnapshots),
      progress: await db.select().from(schema.readingProgress),
      seen: await db.select().from(schema.titleChaptersSeen),
      columns: (
        await client`SELECT column_name FROM information_schema.columns WHERE table_name IN ('bookmarks', 'reading_progress')`
      ).map((row) => row.column_name as string),
    };
  }, 30_000);

  beforeEach(async () => {
    await client`TRUNCATE bookmarks, reading_progress, user_title_snapshot_fallbacks, title_chapter_snapshots, title_chapters_seen, chapter_reads, reading_activity CASCADE`;
    parsers.getDetails.mockClear();
    vi.mocked(links.listCanonicalKeys).mockImplementation(
      async (keys) => new Map(keys.map((key) => [key, key])),
    );
  });
  afterAll(async () => {
    await client.end();
    await admin.unsafe(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`);
    await admin.end();
  });

  it('миграция сохраняет личные версии, nullable прогресс и историю; равенство решает закладка', () => {
    expect(migration.fallbacks.find((row) => row.userId === USER_A)?.name).toBe('Закладка');
    expect(
      migration.fallbacks.find((row) => row.userId === USER_B && row.titleKey === KEY)?.name,
    ).toBe('Чужая версия');
    expect(
      migration.fallbacks.find((row) => row.titleKey.endsWith('/nullable'))?.titleId,
    ).toBeNull();
    expect(
      migration.snapshots.every((row) => row.metadataOrigin === null && row.name === null),
    ).toBe(true);
    expect(
      migration.snapshots.find((row) => row.titleKey.endsWith('/zero'))?.chaptersInitialized,
    ).toBe(true);
    expect(
      migration.snapshots.find((row) => row.titleKey.endsWith('/failed'))?.chaptersInitialized,
    ).toBe(false);
    expect(migration.snapshots.find((row) => row.titleKey === KEY)?.chaptersInitialized).toBe(true);
    expect(migration.progress.find((row) => row.userId === USER_A)).toMatchObject({
      pageIndex: 7,
      hiddenAt: at(1),
      updatedAt: at(2),
    });
    expect(migration.seen[0]).toMatchObject({ baseline: true, firstSeenAt: at(0) });
    expect(migration.columns).not.toContain('title_id');
    expect(migration.columns).not.toContain('cover_url');
  });

  it('личные файлы изолированы, затем один ответ обновляет карточки двух пользователей', async () => {
    await Promise.all([insertBookmark(USER_A), insertBookmark(USER_B)]);
    await db.insert(schema.readingProgress).values([mark(USER_A), mark(USER_B)]);
    await db.transaction(async (tx) => {
      await writeTitleFallbacks(tx, [
        personal(USER_A, 'Моя версия'),
        personal(USER_B, 'Другая версия'),
      ]);
    });
    expect((await resolveTitleSnapshots(db, USER_A, [KEY])).get(KEY)?.name).toBe('Моя версия');
    expect((await resolveTitleSnapshots(db, USER_B, [KEY])).get(KEY)?.name).toBe('Другая версия');
    expect((await resolveTitleSnapshots(db, USER_A, [KEY], true)).get(KEY)?.coverUrl).toBeNull();
    await snapshots.record(
      'remanga',
      '/title',
      title({ contentRating: CONTENT_RATING.ADULT, coverUrl: null }),
      { fetchedAt: at(5).getTime() },
    );
    for (const userId of [USER_A, USER_B]) {
      const list = await bookmarks.list(userId, {
        folderId: (await folder(userId)).id,
        page: 1,
        sort: BOOKMARK_SORT.ALPHABETICAL,
      });
      expect(list.items[0]).toMatchObject({
        name: 'Название источника',
        coverUrl: '',
        contentRating: CONTENT_RATING.ADULT,
      });
      expect((await progress.listRecent(userId)).items[0]?.title).toMatchObject({
        name: 'Название источника',
        coverUrl: '',
        contentRating: CONTENT_RATING.ADULT,
      });
    }
    expect(await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS)).toEqual([]);
    expect(
      (await db.select().from(schema.readingProgress)).every(
        (row) => row.pageIndex === 4 && row.updatedAt.getTime() === at(1).getTime(),
      ),
    ).toBe(true);
    expect(parsers.getDetails).not.toHaveBeenCalled();
  });

  it('дата личного резерва не подменяет даты закладки и чтения в карточках и копии', async () => {
    await insertBookmark(USER_A);
    await db.update(schema.bookmarks).set({ updatedAt: at(2) });
    await db.insert(schema.readingProgress).values({ ...mark(USER_A), updatedAt: at(3) });
    await db.transaction((tx) =>
      writeTitleFallbacks(tx, [{ ...personal(USER_A, 'Личная версия'), updatedAt: at(10) }]),
    );
    expect((await resolveTitleSnapshots(db, USER_A, [KEY])).get(KEY)).toEqual({
      titleId: personal(USER_A, '').titleId,
      name: 'Личная версия',
      coverUrl: 'https://attacker.test/cover.jpg',
      contentRating: CONTENT_RATING.SAFE,
      type: null,
    });
    const exported = await exporter.export(USER_A);
    expect(exported.bookmarks[0]?.updatedAt).toBe(at(2).toISOString().replace('.000Z', 'Z'));
    expect(exported.progress[0]?.updatedAt).toBe(at(3).toISOString().replace('.000Z', 'Z'));
    expect((await progress.listRecent(USER_A)).items[0]?.updatedAt).toBe(
      at(3).toISOString().replace('.000Z', 'Z'),
    );
    const hydrated = await hydrateBookmarks(db, USER_A, await db.select().from(schema.bookmarks));
    expect(hydrated[0]?.updatedAt).toEqual(at(2));
  });

  it('общий снимок и личный резерв читаются в одном SQL-снимке состояния', async () => {
    await db.transaction((tx) => writeTitleFallbacks(tx, [personal(USER_A, 'Личная версия')]));
    const sharedKey = 'remanga:/shared';
    await snapshots.record('remanga', '/shared', title({ url: '/shared', coverUrl: null }));
    const queries: string[] = [];
    const reader = drizzle(client, {
      schema,
      logger: { logQuery: (query) => queries.push(query) },
    });
    const resolved = await resolveTitleSnapshots(reader, USER_A, [KEY, sharedKey]);
    expect(resolved.get(KEY)?.name).toBe('Личная версия');
    expect(resolved.get(sharedKey)).toEqual({
      titleId: titleIdOf('remanga', title({ url: '/shared' })),
      name: 'Название источника',
      coverUrl: null,
      contentRating: CONTENT_RATING.SAFE,
      type: null,
    });
    // Гарантия атомарного чтения при замене резерва общим снимком: один statement, один MVCC snapshot.
    expect(queries).toHaveLength(1);
  });

  it('полные детали побеждают список, старые ответы и stale fallback; отсутствие обложки известно', async () => {
    await snapshots.record(
      'remanga',
      '/title',
      title({ contentRating: CONTENT_RATING.ADULT, type: TITLE_TYPE.MANGA }),
      { fetchedAt: at(5).getTime() },
    );
    await db.transaction((tx) =>
      snapshots.recordSourceBookmarks(
        tx,
        [{ ...personal(USER_A, 'Список'), sourceId: 'remanga' }],
        at(10),
      ),
    );
    await snapshots.record('remanga', '/title', title({ title: 'Старый ответ' }), {
      fetchedAt: at(4).getTime(),
    });
    await snapshots.record('remanga', '/title', title({ title: 'Stale ответ' }), {
      stale: true,
      fetchedAt: at(20).getTime(),
    });
    expect(await shared()).toMatchObject({
      name: 'Название источника',
      metadataFetchedAt: at(5),
      contentRating: CONTENT_RATING.ADULT,
    });
    await snapshots.record('remanga', '/title', title({ coverUrl: null, contentRating: null }), {
      fetchedAt: at(6).getTime(),
    });
    expect(await shared()).toMatchObject({
      coverUrl: null,
      type: null,
      contentRating: CONTENT_RATING.ADULT,
      checkedAt: null,
    });
  });

  it('метаданные не инициализируют главы; гонка первых списков создаёт одну базовую историю', async () => {
    await snapshots.record('remanga', '/title', title(), { fetchedAt: at(1).getTime() });
    expect(await shared()).toMatchObject({ chaptersInitialized: false, checkedAt: null });
    await Promise.all(
      [1, 2].map(() =>
        snapshots.record('remanga', '/title', title({ chapters: [chapter(1), chapter(2, true)] }), {
          fetchedAt: at(2).getTime(),
          force: true,
        }),
      ),
    );
    expect(await db.select().from(schema.titleChaptersSeen)).toMatchObject([{ baseline: true }]);
    await snapshots.record('remanga', '/title', title({ chapters: [chapter(1), chapter(3)] }), {
      fetchedAt: at(3).getTime(),
      force: true,
    });
    expect(await snapshots.listNewChapterIds(KEY, at(0))).toEqual([
      normalizeChapter('remanga', '', chapter(3)).id,
    ]);
    // throttle глав не мешает свежему имени; кеш не двигает checkedAt.
    await snapshots.record('remanga', '/title', title({ title: 'Свежее имя', chapters: [] }), {
      fetchedAt: at(4).getTime(),
    });
    expect(await shared()).toMatchObject({ name: 'Свежее имя', checkedAt: at(3) });
    await snapshots.record('remanga', '/title', title({ chapters: [] }), {
      fetchedAt: at(3).getTime(),
      force: true,
    });
    expect((await shared()).checkedAt).toEqual(at(3));
  });

  it('пустой первый список и 404 сохраняют независимую семантику baseline', async () => {
    await db.transaction((tx) => writeTitleFallbacks(tx, [personal(USER_A, 'Личная версия')]));
    await insertBookmark(USER_A);
    await snapshots.markFailed(KEY, '404', true);
    expect((await shared()).chaptersInitialized).toBe(false);
    await snapshots.record('remanga', '/title', title({ chapters: [] }), {
      fetchedAt: Date.now() + 1,
      force: true,
    });
    expect(await shared()).toMatchObject({
      chaptersInitialized: true,
      chaptersCount: 0,
      missing: false,
    });
    await snapshots.record('remanga', '/title', title({ chapters: [chapter(1)] }), {
      fetchedAt: Date.now() + 2,
      force: true,
    });
    expect((await db.select().from(schema.titleChaptersSeen))[0]?.baseline).toBe(false);
  });

  it('общий снимок и личные записи откатываются вместе', async () => {
    await expect(
      db.transaction(async (tx) => {
        await snapshots.record('remanga', '/title', title(), { tx });
        await tx.insert(schema.readingProgress).values(mark(USER_A));
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(await db.select().from(schema.titleChapterSnapshots)).toEqual([]);
    expect(await db.select().from(schema.readingProgress)).toEqual([]);
  });

  it('чистка ждёт конкурентную запись, хранит скрытый прогресс и удаляет настоящие сироты', async () => {
    await snapshots.record('remanga', '/title', title(), { fetchedAt: at(0).getTime() });
    const locked = deferred();
    const release = deferred();
    const writer = db.transaction(async (tx) => {
      await lockSnapshotLifecycle(tx);
      await snapshots.record('remanga', '/title', title({ chapters: [chapter(1)] }), { tx });
      locked.complete();
      await release.promise;
      await tx.insert(schema.readingProgress).values({ ...mark(USER_A), hiddenAt: at(2) });
    });
    await locked.promise;
    const cleanup = snapshots.deleteOrphans();
    try {
      await vi.waitFor(async () => {
        const [waiting] = await admin`SELECT count(*)::int AS count FROM pg_locks l
          JOIN pg_stat_activity a ON a.pid = l.pid
          WHERE l.locktype = 'advisory' AND NOT l.granted AND a.datname = ${DATABASE_NAME}`;
        expect(waiting!.count).toBeGreaterThan(0);
      });
    } finally {
      release.complete();
    }
    await writer;
    await cleanup;
    expect(await shared()).toMatchObject({ name: 'Название источника' });
    expect(await db.select().from(schema.titleChaptersSeen)).toHaveLength(1);
    await db.delete(schema.readingProgress);
    expect(await snapshots.deleteOrphans()).toBe(1);
    expect(await db.select().from(schema.titleChaptersSeen)).toEqual([]);
    expect(await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS)).toEqual([]);
  });

  it('восстановление и экспорт старой копии работают без источника и не публикуют данные', async () => {
    const backup: Backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      origin: ENV.APP_URL,
      exportedAt: at(1).toISOString(),
      username: 'a',
      settings: { user: {}, sourceOrder: null, reader: null, disabledSources: [] },
      folders: [
        {
          key: 'planned',
          builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
          name: null,
          icon: null,
          color: null,
          position: 0,
          trackUpdates: true,
        },
      ],
      bookmarks: [
        {
          titleId: personal(USER_A, '').titleId,
          folderKey: 'planned',
          name: 'Из файла',
          coverUrl: 'https://attacker.test/cover',
          contentRating: CONTENT_RATING.SAFE,
          type: null,
          visitedAt: at(1).toISOString(),
          createdAt: at(1).toISOString(),
          updatedAt: at(1).toISOString(),
        },
      ],
      progress: [
        {
          ...mark(USER_A),
          titleId: null,
          titleName: null,
          coverUrl: null,
          contentRating: null,
          type: null,
          hiddenAt: at(2).toISOString(),
          updatedAt: at(1).toISOString(),
          titleKey: 'remanga:/progress-only',
        },
      ],
      chapterReads: [],
      readingActivity: [],
    };
    const request = {
      backup,
      folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
      progressPolicy: RESTORE_PROGRESS_POLICY.FROM_BACKUP,
      applySettings: false,
    };
    await restorer.restore(USER_A, request);
    const exported = await exporter.export(USER_A);
    expect(exported.bookmarks[0]).toMatchObject({
      name: 'Из файла',
      coverUrl: 'https://attacker.test/cover',
    });
    expect(exported.progress[0]).toMatchObject({
      titleId: null,
      titleName: null,
      hiddenAt: at(2).toISOString().replace('.000Z', 'Z'),
    });
    await restorer.restore(USER_B, { ...request, backup: exported });
    expect((await exporter.export(USER_B)).bookmarks).toEqual(
      exported.bookmarks.map((row) => ({
        ...row,
        folderKey: expect.any(String) as unknown as string,
      })),
    );
    expect(await db.select().from(schema.titleChapterSnapshots)).toEqual([]);
    expect(parsers.getDetails).not.toHaveBeenCalled();
    await snapshots.record('remanga', '/title', title());
    expect((await exporter.export(USER_A)).bookmarks[0]?.name).toBe('Название источника');
    expect((await exporter.export(USER_B)).bookmarks[0]?.name).toBe('Название источника');
  });

  it('цель только из прогресса использует свои метаданные, поиск и сортировку', async () => {
    await insertBookmark(USER_A);
    await snapshots.record('remanga', '/title', title({ title: 'Старое имя' }));
    const targetKey = 'mangalib:/target';
    await db
      .insert(schema.readingProgress)
      .values({ ...mark(USER_A, targetKey), sourceId: 'mangalib' });
    await snapshots.record(
      'mangalib',
      '/target',
      title({ url: '/target', title: 'Имя назначения', coverUrl: null }),
    );
    vi.mocked(links.listCanonicalKeys).mockImplementation(
      async (keys) => new Map(keys.map((key) => [key, KEY])),
    );
    const query = {
      folderId: (await folder(USER_A)).id,
      page: 1,
      sort: BOOKMARK_SORT.ALPHABETICAL,
    };
    const list = await bookmarks.list(USER_A, { ...query, query: 'назначения' });
    expect(list.items[0]).toMatchObject({
      sourceId: 'mangalib',
      name: 'Имя назначения',
      coverUrl: '',
    });
    expect((await bookmarks.list(USER_A, { ...query, query: 'Старое имя' })).items).toEqual([]);
  });

  it('импорт сайта проходит через merge с доверием источнику и не перезаписывает полные детали', async () => {
    const parser = {
      getBookmarks: async () => [
        {
          id: 'planned',
          builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
          name: 'В планах',
          items: [
            {
              id: 1,
              url: '/title',
              title: 'Список сайта',
              coverUrl: null,
              contentRating: null,
              type: null,
              lastChapterNumber: null,
              lastChapterVolume: null,
            },
          ],
        },
      ],
    } as unknown as ParsersClientService;
    const importer = new SourceImportService(
      database,
      folders,
      links,
      notifications,
      merge,
      parser,
    );
    const request = {
      sourceId: 'remanga',
      folderIds: ['planned'],
      folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
      progressPolicy: RESTORE_PROGRESS_POLICY.KEEP_MINE,
    };
    await importer.import(USER_A, request);
    expect(await shared()).toMatchObject({
      name: 'Список сайта',
      metadataOrigin: TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK,
      chaptersInitialized: false,
      checkedAt: null,
    });
    await snapshots.record(
      'remanga',
      '/title',
      title({ title: 'Полные детали', contentRating: CONTENT_RATING.ADULT }),
    );
    await importer.import(USER_B, request);
    expect(await shared()).toMatchObject({
      name: 'Полные детали',
      metadataOrigin: TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS,
      contentRating: CONTENT_RATING.ADULT,
    });
    expect(await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS)).toEqual([]);
  });

  it('достройка импорта обновляет общий снимок даже при сохранении более дальней личной отметки', async () => {
    await insertBookmark(USER_A);
    await db.insert(schema.readingProgress).values({ ...mark(USER_A), chapterNumber: 10 });
    const sourceTitle = title({ chapters: [chapter(1)], title: 'Детали достройки' });
    const parser = {
      getDetails: async () => ({ data: sourceTitle, stale: false, fetchedAt: at(10).getTime() }),
    } as unknown as ParsersClientService;
    await db.insert(schema.sourceImportProgress).values({
      userId: USER_A,
      importId: randomUUID(),
      sourceId: 'remanga',
      titleKey: KEY,
      titleId: titleIdOf('remanga', sourceTitle),
      chapterNumber: 1,
      chapterVolume: null,
      pageIndex: null,
      progressPolicy: RESTORE_PROGRESS_POLICY.KEEP_MINE,
      status: SOURCE_IMPORT_PROGRESS_STATUS.PENDING,
      nextAttemptAt: at(0),
    });
    const service = new SourceImportProgressService(
      database,
      parser,
      links,
      { notify: async () => {} } as unknown as NotificationsService,
      snapshots,
    );
    await service.processDue();
    expect((await shared()).name).toBe('Детали достройки');
    expect((await db.select().from(schema.readingProgress))[0]?.chapterNumber).toBe(10);
  });

  it('«Вернуть закладку» не откатывает общие данные и не подписывает клиентскую обложку', async () => {
    await insertBookmark(USER_A);
    await snapshots.record('remanga', '/title', title({ title: 'Старое имя' }), {
      fetchedAt: at(1).getTime(),
    });
    const removed = await bookmarks.removeForTitle(USER_A, titleIdOf('remanga', title()));
    await snapshots.record('remanga', '/title', title({ title: 'Новое имя' }), {
      fetchedAt: at(2).getTime(),
    });
    await bookmarks.restore(USER_A, removed);
    expect((await exporter.export(USER_A)).bookmarks[0]?.name).toBe('Новое имя');
    const again = await bookmarks.removeForTitle(USER_A, titleIdOf('remanga', title()));
    await snapshots.deleteOrphans();
    await bookmarks.restore(
      USER_A,
      again.map((row) => ({ ...row, coverUrl: 'https://attacker.test/evil' })),
    );
    expect(await db.select().from(schema.titleChapterSnapshots)).toEqual([]);
    expect((await exporter.export(USER_A)).bookmarks[0]).toMatchObject({
      name: 'Новое имя',
      coverUrl: null,
    });
  });

  it('нулевой и неизвестный рейтинг не снимают ADULT у взрослого источника или неполного списка', async () => {
    await snapshots.record('hentailib', '/adult', title({ url: '/adult', contentRating: null }));
    expect(
      (await db.select().from(schema.titleChapterSnapshots)).find(
        (row) => row.sourceId === 'hentailib',
      )?.contentRating,
    ).toBe(CONTENT_RATING.ADULT);
    await db.transaction((tx) =>
      snapshots.recordSourceBookmarks(
        tx,
        [
          {
            ...personal(USER_A, 'Список'),
            contentRating: CONTENT_RATING.ADULT,
            sourceId: 'remanga',
          },
        ],
        at(1),
      ),
    );
    await db.transaction((tx) =>
      snapshots.recordSourceBookmarks(
        tx,
        [
          {
            ...personal(USER_A, 'Неполный список'),
            contentRating: CONTENT_RATING.SAFE,
            sourceId: 'remanga',
          },
        ],
        at(2),
      ),
    );
    expect((await shared()).contentRating).toBe(CONTENT_RATING.ADULT);
  });

  it('большой набор дедуплицируется и сохраняется пакетно без потери личных версий', async () => {
    const rows = Array.from({ length: 1100 }, (_, index) => ({
      ...personal(USER_A, `Тайтл ${index}`),
      titleKey: `remanga:/bulk/${index}`,
      titleId: titleIdOf('remanga', { id: index, url: `/bulk/${index}` }),
      sourceId: 'remanga',
    }));
    await db.transaction((tx) => writeTitleFallbacks(tx, [...rows, rows[0]!]));
    const keys = rows.map(({ titleKey }) => titleKey);
    expect((await resolveTitleSnapshots(db, USER_A, keys)).size).toBe(1100);
    expect((await resolveTitleSnapshots(db, USER_B, keys)).size).toBe(0);
    await db.transaction((tx) => snapshots.recordSourceBookmarks(tx, rows, at(2)));
    expect((await resolveTitleSnapshots(db, USER_B, keys)).size).toBe(1100);
    expect(await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS)).toEqual([]);
  });

  it('пропущенный конфликт прогресса не меняет личный резерв даже при новой дате файла', async () => {
    await db.insert(schema.readingProgress).values({ ...mark(USER_A), chapterNumber: 10 });
    await db.transaction((tx) => writeTitleFallbacks(tx, [personal(USER_A, 'Сохранённое имя')]));
    const backup = await exporter.export(USER_A);
    const incoming = {
      ...backup,
      progress: backup.progress.map((row) => ({
        ...row,
        chapterNumber: 1,
        chapterId: normalizeChapter('remanga', '', chapter(2)).id,
        titleName: 'Непринятая подмена',
        updatedAt: at(30).toISOString(),
      })),
    };
    await restorer.restore(USER_A, {
      backup: incoming,
      folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
      progressPolicy: RESTORE_PROGRESS_POLICY.KEEP_MINE,
      applySettings: false,
    });
    expect((await exporter.export(USER_A)).progress[0]).toMatchObject({
      titleName: 'Сохранённое имя',
      chapterNumber: 10,
    });
  });

  it('удаление аккаунта убирает только его личный резерв', async () => {
    await db.transaction((tx) =>
      writeTitleFallbacks(tx, [personal(USER_A, 'A'), personal(USER_B, 'B')]),
    );
    const temporary = randomUUID();
    await client`INSERT INTO users (id, email, username, password_hash, role, language) VALUES (${temporary}, 'temporary@test', 'temporary', 'hash', 'user', 'ru')`;
    await db.transaction((tx) => writeTitleFallbacks(tx, [personal(temporary, 'temporary')]));
    await db.delete(schema.users).where(eq(schema.users.id, temporary));
    expect(
      (await db.select().from(schema.USER_TITLE_SNAPSHOT_FALLBACKS))
        .map((row) => row.userId)
        .sort(),
    ).toEqual([USER_A, USER_B]);
  });
});
