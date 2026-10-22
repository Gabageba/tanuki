import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IDS,
  type Backup,
  type BackupBookmark,
  type BackupFolder,
  type BackupProgress,
} from '@tanuki/contracts';
import { encodeTitleId } from '../common/opaque-id';
import type { BookmarkFolderRecord } from '../library/bookmark-folders.service';
import type { BookmarkRecord } from '../library/models';
import { linkKeyOf } from '../matches/title-links.service';
import { buildRestorePlan, isFurther, type RestorePlanInput } from './backup-plan';
import type { ProgressMark } from './models';

const [SOURCE_A, SOURCE_B] = SOURCE_IDS as [string, string];
const UNKNOWN_SOURCE = 'gone_source';

const titleIdOf = (sourceId: string, url: string) => `${sourceId}:${encodeTitleId({ id: 1, url })}`;

const folder = (overrides: Partial<BookmarkFolderRecord>): BookmarkFolderRecord => ({
  id: 'folder',
  userId: 'user',
  builtIn: null,
  name: null,
  icon: null,
  color: null,
  position: 0,
  trackUpdates: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...overrides,
});

const USER_FOLDERS = [
  folder({ id: 'reading', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, position: 0 }),
  folder({ id: 'planned', builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED, position: 1 }),
  folder({ id: 'completed', builtIn: BUILT_IN_BOOKMARK_FOLDER.COMPLETED, position: 2 }),
  folder({ id: 'dropped', builtIn: BUILT_IN_BOOKMARK_FOLDER.DROPPED, position: 3 }),
  folder({
    id: 'favorites',
    name: 'Избранное',
    icon: BOOKMARK_FOLDER_ICON.STAR,
    color: BOOKMARK_FOLDER_COLOR.BLUE,
    position: 4,
  }),
];

const backupFolder = (overrides: Partial<BackupFolder>): BackupFolder => ({
  key: 'b-folder',
  builtIn: null,
  name: 'Своя',
  icon: BOOKMARK_FOLDER_ICON.STAR,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  trackUpdates: true,
  position: 10,
  ...overrides,
});

const BACKUP_BUILT_INS = [
  backupFolder({
    key: 'b-reading',
    builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
    name: null,
    position: 0,
  }),
  backupFolder({
    key: 'b-planned',
    builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
    name: null,
    position: 1,
  }),
];

const backupBookmark = (
  sourceId: string,
  url: string,
  folderKey: string,
  overrides: Partial<BackupBookmark> = {},
): BackupBookmark => ({
  titleId: titleIdOf(sourceId, url),
  folderKey,
  name: url,
  coverUrl: null,
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  visitedAt: '2026-10-01T00:00:00Z',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

const userBookmark = (sourceId: string, url: string, folderId: string): BookmarkRecord => ({
  userId: 'user',
  titleKey: linkKeyOf(sourceId, url),
  sourceId,
  titleId: titleIdOf(sourceId, url),
  folderId,
  name: url,
  coverUrl: null,
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  visitedAt: new Date(0),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const backupProgress = (url: string, overrides: Partial<BackupProgress> = {}): BackupProgress => ({
  titleKey: linkKeyOf(SOURCE_A, url),
  sourceId: SOURCE_A,
  chapterId: `${SOURCE_A}:ch-10`,
  chapterVolume: null,
  chapterNumber: 10,
  chapterTitle: null,
  branchId: 'default',
  pageIndex: 0,
  titleId: null,
  titleName: null,
  coverUrl: null,
  contentRating: null,
  type: null,
  hiddenAt: null,
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

const userMark = (url: string, overrides: Partial<ProgressMark> = {}): ProgressMark => ({
  titleKey: linkKeyOf(SOURCE_A, url),
  chapterId: `${SOURCE_A}:ch-5`,
  chapterNumber: 5,
  pageIndex: 0,
  updatedAt: new Date('2026-09-01T00:00:00Z'),
  ...overrides,
});

const backupOf = (overrides: Partial<Backup>): Backup => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: '2026-10-12T10:00:00Z',
  origin: 'https://tanuki.example.com',
  username: 'gabageba',
  settings: { user: {}, sourceOrder: null, reader: null, disabledSources: [] },
  folders: BACKUP_BUILT_INS,
  bookmarks: [],
  progress: [],
  chapterReads: [],
  readingActivity: [],
  ...overrides,
});

const plan = (overrides: Partial<RestorePlanInput>) =>
  buildRestorePlan({
    backup: backupOf({}),
    knownSourceIds: new Set([SOURCE_A, SOURCE_B]),
    folders: USER_FOLDERS,
    bookmarks: [],
    progress: [],
    chapterReadIds: new Set(),
    canonical: new Map(),
    folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
    progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
    ...overrides,
  });

describe('buildRestorePlan — папки', () => {
  it('встроенные сопоставляет по builtIn, свою — по имени без учёта регистра', () => {
    const result = plan({
      backup: backupOf({
        folders: [...BACKUP_BUILT_INS, backupFolder({ key: 'b-fav', name: 'ИЗБРАННОЕ' })],
        bookmarks: [
          backupBookmark(SOURCE_A, '/a', 'b-reading'),
          backupBookmark(SOURCE_A, '/b', 'b-fav'),
        ],
      }),
    });

    expect(result.folderCreates).toEqual([]);
    expect(result.counts.foldersMatched).toBe(1);
    expect(result.bookmarkInserts.map(({ folder }) => folder)).toEqual([
      { id: 'reading' },
      { id: 'favorites' },
    ]);
  });

  it('новую свою папку создаёт, а сверх лимита — кладёт её тайтлы во «В планах»', () => {
    const customs = Array.from({ length: CUSTOM_BOOKMARK_FOLDERS_LIMIT - 2 }, (_, index) =>
      folder({ id: `custom-${index}`, name: `Папка ${index}`, position: 5 + index }),
    );
    const result = plan({
      folders: [...USER_FOLDERS, ...customs],
      backup: backupOf({
        folders: [
          ...BACKUP_BUILT_INS,
          backupFolder({ key: 'b-new', name: 'Новая', position: 10 }),
          backupFolder({ key: 'b-over', name: 'Лишняя', position: 11 }),
        ],
        bookmarks: [
          backupBookmark(SOURCE_A, '/new', 'b-new'),
          backupBookmark(SOURCE_A, '/over', 'b-over'),
        ],
      }),
    });

    expect(result.folderCreates.map(({ key }) => key)).toEqual(['b-new']);
    expect(result.counts).toMatchObject({
      foldersAdded: 1,
      foldersOverLimit: 1,
      titlesToPlanned: 1,
    });
    expect(result.bookmarkInserts.map(({ folder }) => folder)).toEqual([
      { key: 'b-new' },
      { id: 'planned' },
    ]);
  });
});

describe('buildRestorePlan — закладки', () => {
  it('тайтла нет ни в закладках, ни в группе — добавляет в папку копии', () => {
    const result = plan({
      backup: backupOf({ bookmarks: [backupBookmark(SOURCE_A, '/a', 'b-reading')] }),
    });
    expect(result.counts.bookmarksAdded).toBe(1);
    expect(result.bookmarkInserts).toHaveLength(1);
  });

  it.each([RESTORE_FOLDER_POLICY.KEEP_MINE, RESTORE_FOLDER_POLICY.FROM_BACKUP])(
    'тот же тайтл в той же папке — ничего не пишет (%s)',
    (folderPolicy) => {
      const result = plan({
        folderPolicy,
        bookmarks: [userBookmark(SOURCE_A, '/a', 'reading')],
        backup: backupOf({ bookmarks: [backupBookmark(SOURCE_A, '/a', 'b-reading')] }),
      });
      expect(result.counts.bookmarksSameFolder).toBe(1);
      expect(result.bookmarkInserts).toEqual([]);
      expect(result.groupMoves).toEqual([]);
    },
  );

  it('тот же тайтл в другой папке: «Оставить мои» не трогает, «Взять из копии» переносит группу', () => {
    const input = {
      bookmarks: [userBookmark(SOURCE_A, '/a', 'completed')],
      backup: backupOf({ bookmarks: [backupBookmark(SOURCE_A, '/a', 'b-reading')] }),
    };

    const keep = plan({ ...input, folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE });
    expect(keep.counts).toMatchObject({ bookmarksOtherFolder: 1, bookmarksMoved: 0 });
    expect(keep.groupMoves).toEqual([]);

    const take = plan({ ...input, folderPolicy: RESTORE_FOLDER_POLICY.FROM_BACKUP });
    expect(take.counts).toMatchObject({ bookmarksOtherFolder: 1, bookmarksMoved: 1 });
    expect(take.groupMoves).toEqual([
      { titleKeys: [linkKeyOf(SOURCE_A, '/a')], folder: { id: 'reading' } },
    ]);
  });

  it('в группе есть другая копия: строка добавляется в папку группы или вся группа переезжает', () => {
    const mineKey = linkKeyOf(SOURCE_B, '/b');
    const backupKey = linkKeyOf(SOURCE_A, '/a');
    const input = {
      bookmarks: [userBookmark(SOURCE_B, '/b', 'completed')],
      canonical: new Map([
        [mineKey, mineKey],
        [backupKey, mineKey],
      ]),
      backup: backupOf({ bookmarks: [backupBookmark(SOURCE_A, '/a', 'b-reading')] }),
    };

    const keep = plan({ ...input, folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE });
    expect(keep.counts.bookmarksAdded).toBe(0);
    expect(keep.bookmarkInserts.map(({ titleKey, folder }) => ({ titleKey, folder }))).toEqual([
      { titleKey: backupKey, folder: { id: 'completed' } },
    ]);
    expect(keep.groupMoves).toEqual([]);

    const take = plan({ ...input, folderPolicy: RESTORE_FOLDER_POLICY.FROM_BACKUP });
    expect(take.bookmarkInserts.map(({ folder }) => folder)).toEqual([{ id: 'reading' }]);
    expect(take.groupMoves).toEqual([{ titleKeys: [mineKey], folder: { id: 'reading' } }]);
  });

  it('пропускает тайтлы источников, которых нет на инстансе', () => {
    const result = plan({
      backup: backupOf({
        bookmarks: [
          backupBookmark(UNKNOWN_SOURCE, '/x', 'b-reading'),
          backupBookmark(SOURCE_A, '/a', 'b-reading'),
        ],
      }),
    });
    expect(result.counts).toMatchObject({ bookmarksAdded: 1, bookmarksSkipped: 1 });
    expect(result.bookmarkInserts.map(({ sourceId }) => sourceId)).toEqual([SOURCE_A]);
  });

  it('повторное восстановление того же файла ничего не добавляет', () => {
    const result = plan({
      bookmarks: [userBookmark(SOURCE_A, '/a', 'reading')],
      progress: [userMark('/a', { chapterId: `${SOURCE_A}:ch-10`, chapterNumber: 10 })],
      chapterReadIds: new Set([`${SOURCE_A}:ch-10`]),
      backup: backupOf({
        bookmarks: [backupBookmark(SOURCE_A, '/a', 'b-reading')],
        progress: [backupProgress('/a')],
        chapterReads: [
          {
            chapterId: `${SOURCE_A}:ch-10`,
            sourceId: SOURCE_A,
            titleKey: linkKeyOf(SOURCE_A, '/a'),
            chapterVolume: null,
            chapterNumber: 10,
            tags: [],
            readAt: '2026-10-01T00:00:00Z',
          },
        ],
      }),
    });
    expect(result.bookmarkInserts).toEqual([]);
    expect(result.progressUpserts).toEqual([]);
    expect(result.chapterReads).toEqual([]);
    expect(result.counts).toMatchObject({
      bookmarksAdded: 0,
      progressAdded: 0,
      progressDiffers: 0,
    });
  });
});

describe('buildRestorePlan — где остановился', () => {
  it('отметки нет — пишет её при любом выборе', () => {
    const result = plan({
      progressPolicy: RESTORE_PROGRESS_POLICY.KEEP_MINE,
      backup: backupOf({ progress: [backupProgress('/a')] }),
    });
    expect(result.counts.progressAdded).toBe(1);
    expect(result.progressUpserts).toHaveLength(1);
  });

  it.each([
    [RESTORE_PROGRESS_POLICY.FURTHEST, 1],
    [RESTORE_PROGRESS_POLICY.KEEP_MINE, 0],
    [RESTORE_PROGRESS_POLICY.FROM_BACKUP, 1],
  ] as const)('расходящаяся отметка дальше в копии — %s заменяет %i', (progressPolicy, updated) => {
    const result = plan({
      progressPolicy,
      progress: [userMark('/a')],
      backup: backupOf({ progress: [backupProgress('/a')] }),
    });
    expect(result.counts).toMatchObject({ progressDiffers: 1, progressUpdated: updated });
  });

  it('«Дальше прочитанное» не трогает отметку, если ваша дальше', () => {
    const result = plan({
      progress: [userMark('/a', { chapterId: `${SOURCE_A}:ch-20`, chapterNumber: 20 })],
      backup: backupOf({ progress: [backupProgress('/a')] }),
    });
    expect(result.counts).toMatchObject({ progressDiffers: 1, progressUpdated: 0 });
  });

  it('пропускает отметки источников, которых нет на инстансе', () => {
    const result = plan({
      backup: backupOf({
        progress: [
          backupProgress('/x', {
            sourceId: UNKNOWN_SOURCE,
            titleKey: linkKeyOf(UNKNOWN_SOURCE, '/x'),
          }),
        ],
      }),
    });
    expect(result.counts).toMatchObject({ progressAdded: 0, progressSkipped: 1 });
  });
});

describe('isFurther', () => {
  it('сравнивает номер главы, при равенстве — страницу', () => {
    expect(
      isFurther(backupProgress('/a', { chapterNumber: 10 }), userMark('/a', { chapterNumber: 9 })),
    ).toBe(true);
    expect(
      isFurther(
        backupProgress('/a', { chapterNumber: 10, pageIndex: 3 }),
        userMark('/a', { chapterNumber: 10, pageIndex: 5 }),
      ),
    ).toBe(false);
  });

  it('без номера у одной из сторон побеждает свежая', () => {
    expect(
      isFurther(
        backupProgress('/a', { chapterNumber: null, updatedAt: '2026-10-01T00:00:00Z' }),
        userMark('/a', { updatedAt: new Date('2026-09-01T00:00:00Z') }),
      ),
    ).toBe(true);
  });
});

describe('buildRestorePlan — статистика', () => {
  it('объединяет журнал и минуты чтения без повторов', () => {
    const read = (chapterId: string, sourceId = SOURCE_A) => ({
      chapterId,
      sourceId,
      titleKey: linkKeyOf(sourceId, '/a'),
      chapterVolume: null,
      chapterNumber: 1,
      tags: [],
      readAt: '2026-10-01T00:00:00Z',
    });
    const result = plan({
      chapterReadIds: new Set(['known']),
      backup: backupOf({
        chapterReads: [read('known'), read('new'), read('gone', UNKNOWN_SOURCE)],
        readingActivity: [
          { minute: '2026-10-01T10:00:00Z', seconds: 20 },
          { minute: '2026-10-01T10:00:00Z', seconds: 45 },
        ],
      }),
    });
    expect(result.chapterReads.map(({ chapterId }) => chapterId)).toEqual(['new']);
    expect(result.counts).toMatchObject({ chapterReadsAdded: 1, chapterReadsSkipped: 1 });
    expect(result.readingActivity).toEqual([{ minute: '2026-10-01T10:00:00Z', seconds: 45 }]);
  });
});
