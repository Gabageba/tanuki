import { describe, expect, it } from 'vitest';
import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IDS,
  SOURCE_IMPORT_FOLDER_TARGET,
} from '@tanuki/contracts';
import { titleIdOf } from '../common/normalize';
import type { BookmarkFolderRecord } from '../library/bookmark-folders.service';
import type { BookmarkRecord } from '../library/models';
import { linkKeyOf } from '../matches/title-links.service';
import type { RawBookmark, RawBookmarkFolder } from '../parsers-client/parsers-client.types';
import type { ImportProgressMark } from './models';
import {
  buildSourceImportPlan,
  winsSiteProgress,
  type SourceImportPlanInput,
} from './source-import-plan';

const [SOURCE, OTHER_SOURCE] = SOURCE_IDS as [string, string];

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
    name: 'Любимые',
    icon: BOOKMARK_FOLDER_ICON.STAR,
    color: BOOKMARK_FOLDER_COLOR.BLUE,
    position: 4,
  }),
];

const item = (url: string, overrides: Partial<RawBookmark> = {}): RawBookmark => ({
  id: 1,
  url,
  title: url,
  coverUrl: null,
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  lastChapterNumber: null,
  ...overrides,
});

const siteFolder = (
  id: string,
  items: RawBookmark[],
  builtIn: RawBookmarkFolder['builtIn'] = null,
): RawBookmarkFolder => ({ id, builtIn, name: id, items });

const userBookmark = (sourceId: string, url: string, folderId: string): BookmarkRecord => ({
  userId: 'user',
  titleKey: linkKeyOf(sourceId, url),
  sourceId,
  titleId: titleIdOf(sourceId, { id: 1, url }),
  folderId,
  name: url,
  coverUrl: null,
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  visitedAt: new Date(0),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const mark = (sourceId: string, url: string, chapterNumber: number | null): ImportProgressMark => ({
  titleKey: linkKeyOf(sourceId, url),
  chapterNumber,
  updatedAt: new Date(0),
});

const plan = (overrides: Partial<SourceImportPlanInput>) =>
  buildSourceImportPlan({
    sourceId: SOURCE,
    siteFolders: [],
    folders: USER_FOLDERS,
    bookmarks: [],
    progress: [],
    canonical: new Map(),
    folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
    progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
    now: new Date('2026-10-24T10:00:00Z'),
    ...overrides,
  });

const READING = BUILT_IN_BOOKMARK_FOLDER.READING;

describe('buildSourceImportPlan', () => {
  it('раскладывает папки сайта: встроенная, совпавшая по имени, новая', () => {
    const result = plan({
      siteFolders: [
        siteFolder('reading', [item('/a')], READING),
        siteFolder('ЛЮБИМЫЕ', [item('/b')]),
        siteFolder('Отложено', [item('/c'), item('/d')]),
      ],
    });

    expect(result.folders.map(({ id, target }) => [id, target])).toEqual([
      ['reading', SOURCE_IMPORT_FOLDER_TARGET.BUILT_IN],
      ['ЛЮБИМЫЕ', SOURCE_IMPORT_FOLDER_TARGET.MATCHED],
      ['Отложено', SOURCE_IMPORT_FOLDER_TARGET.CREATED],
    ]);
    expect(result.folders[2]).toMatchObject({
      total: 2,
      fresh: 2,
      targetFolder: { name: 'Отложено', icon: BOOKMARK_FOLDER_ICON.BOOKMARK },
    });
    expect(result.folderCreates).toHaveLength(1);
    expect(result.counts).toMatchObject({
      bookmarksAdded: 4,
      foldersCreated: 1,
      foldersMatched: 1,
    });
    expect(result.bookmarkInserts.map(({ folder }) => folder)).toEqual([
      { id: 'reading' },
      { id: 'favorites' },
      { key: 'Отложено' },
      { key: 'Отложено' },
    ]);
  });

  it('своих папок сверх лимита не создаёт — их тайтлы ложатся во «В планах»', () => {
    const extra = Array.from({ length: CUSTOM_BOOKMARK_FOLDERS_LIMIT }, (_, index) =>
      siteFolder(`f${index}`, [item(`/t${index}`)]),
    );
    const result = plan({ siteFolders: extra });

    const last = result.folders.at(-1)!;
    expect(last.target).toBe(SOURCE_IMPORT_FOLDER_TARGET.OVER_LIMIT);
    expect(last.targetFolder.builtIn).toBe(BUILT_IN_BOOKMARK_FOLDER.PLANNED);
    expect(result.counts).toMatchObject({ foldersOverLimit: 1, titlesToPlanned: 1 });
  });

  it('невыбранные и пустые папки не создаются и ничего не пишут', () => {
    const result = plan({
      siteFolders: [
        siteFolder('empty', []),
        siteFolder('skip', [item('/a')]),
        siteFolder('take', [item('/b')]),
      ],
      selectedFolderIds: new Set(['take']),
    });

    expect(result.folderCreates.map(({ key }) => key)).toEqual(['take']);
    expect(result.bookmarkInserts.map(({ titleKey }) => titleKey)).toEqual([
      linkKeyOf(SOURCE, '/b'),
    ]);
  });

  it('лимит делится как в сводке: снятая папка не освобождает место для следующей', () => {
    const taken = Array.from({ length: CUSTOM_BOOKMARK_FOLDERS_LIMIT - 2 }, (_, index) =>
      folder({ id: `own${index}`, name: `Своя ${index}`, position: 5 + index }),
    );
    const input = {
      folders: [...USER_FOLDERS, ...taken],
      siteFolders: [siteFolder('A', [item('/a')]), siteFolder('B', [item('/b')])],
    };

    const summary = plan(input);
    expect(summary.folders.map(({ target }) => target)).toEqual([
      SOURCE_IMPORT_FOLDER_TARGET.CREATED,
      SOURCE_IMPORT_FOLDER_TARGET.OVER_LIMIT,
    ]);

    const result = plan({ ...input, selectedFolderIds: new Set(['B']) });
    expect(result.folderCreates).toEqual([]);
    expect(result.bookmarkInserts.map(({ folder }) => folder)).toEqual([{ id: 'planned' }]);
    expect(result.counts).toMatchObject({ foldersCreated: 0, foldersOverLimit: 1 });
  });

  it('повторный импорт пропускает то, что уже лежит в той же папке', () => {
    const result = plan({
      siteFolders: [siteFolder('reading', [item('/a'), item('/b')], READING)],
      bookmarks: [userBookmark(SOURCE, '/a', 'reading')],
    });

    expect(result.folders[0]).toMatchObject({ total: 2, fresh: 1, otherFolder: 0 });
    expect(result.bookmarkInserts).toHaveLength(1);
  });

  it('тайтл из группы добавляется ещё одним источником, а не дублем', () => {
    const otherKey = linkKeyOf(OTHER_SOURCE, '/a');
    const result = plan({
      siteFolders: [siteFolder('reading', [item('/a')], READING)],
      bookmarks: [userBookmark(OTHER_SOURCE, '/a', 'reading')],
      canonical: new Map([[linkKeyOf(SOURCE, '/a'), otherKey]]),
    });

    expect(result.counts).toMatchObject({ bookmarksAdded: 0, bookmarksAsSource: 1 });
    expect(result.bookmarkInserts[0]!.folder).toEqual({ id: 'reading' });
  });

  it('тайтл в другой папке: «Оставить мои» не двигает, «Взять из источника» переносит группу', () => {
    const input = {
      siteFolders: [siteFolder('reading', [item('/a')], READING)],
      bookmarks: [userBookmark(SOURCE, '/a', 'dropped')],
    };

    const keep = plan(input);
    expect(keep.folders[0]).toMatchObject({ fresh: 1, otherFolder: 1 });
    expect(keep.groupMoves).toEqual([]);
    expect(keep.bookmarkInserts).toEqual([]);

    const take = plan({ ...input, folderPolicy: RESTORE_FOLDER_POLICY.FROM_BACKUP });
    expect(take.groupMoves).toEqual([
      { titleKeys: [linkKeyOf(SOURCE, '/a')], folder: { id: 'reading' } },
    ]);
    expect(take.counts.bookmarksMoved).toBe(1);
  });

  it('тайтл, что лежит на сайте в двух папках, берётся из первой', () => {
    const result = plan({
      siteFolders: [
        siteFolder('reading', [item('/a')], READING),
        siteFolder('dropped', [item('/a')], BUILT_IN_BOOKMARK_FOLDER.DROPPED),
      ],
    });

    expect(result.folders.map(({ total }) => total)).toEqual([1, 0]);
    expect(result.bookmarkInserts).toHaveLength(1);
  });

  it('дубль берётся из первой выбранной папки, а не из снятой', () => {
    const result = plan({
      siteFolders: [
        siteFolder('reading', [item('/a')], READING),
        siteFolder('dropped', [item('/a'), item('/b')], BUILT_IN_BOOKMARK_FOLDER.DROPPED),
      ],
      selectedFolderIds: new Set(['dropped']),
    });

    expect(result.bookmarkInserts.map(({ titleKey, folder }) => [titleKey, folder])).toEqual([
      [linkKeyOf(SOURCE, '/a'), { id: 'dropped' }],
      [linkKeyOf(SOURCE, '/b'), { id: 'dropped' }],
    ]);
  });

  it('папка из одних дублей снятой соседней получает своё место, а не «В планах»', () => {
    const result = plan({
      siteFolders: [siteFolder('Читаю', [item('/a')]), siteFolder('Своя', [item('/a')])],
      selectedFolderIds: new Set(['Своя']),
    });

    expect(result.folderCreates.map(({ key }) => key)).toEqual(['Своя']);
    expect(result.bookmarkInserts.map(({ folder }) => folder)).toEqual([{ key: 'Своя' }]);
  });

  it('у уже импортированного тайтла «где остановился» всё равно сравнивается', () => {
    const result = plan({
      siteFolders: [siteFolder('reading', [item('/a', { lastChapterNumber: 50 })], READING)],
      bookmarks: [userBookmark(SOURCE, '/a', 'reading')],
      progress: [mark(SOURCE, '/a', 10)],
    });

    expect(result.folders[0]).toMatchObject({ fresh: 0, progressDiffers: 1 });
    expect(result.bookmarkInserts).toEqual([]);
    expect(result.pendingProgress.map(({ chapterNumber }) => chapterNumber)).toEqual([50]);
  });

  it('считает расхождения «где остановился» и кладёт в ожидание то, что запишется', () => {
    const result = plan({
      siteFolders: [
        siteFolder(
          'reading',
          [
            item('/new', { lastChapterNumber: 5 }),
            item('/behind', { lastChapterNumber: 3 }),
            item('/ahead', { lastChapterNumber: 9 }),
            item('/same', { lastChapterNumber: 4 }),
            item('/unknown'),
          ],
          READING,
        ),
      ],
      progress: [mark(SOURCE, '/behind', 7), mark(SOURCE, '/ahead', 2), mark(SOURCE, '/same', 4)],
    });

    expect(result.folders[0]!.progressDiffers).toBe(2);
    expect(result.pendingProgress.map(({ titleKey }) => titleKey)).toEqual([
      linkKeyOf(SOURCE, '/new'),
      linkKeyOf(SOURCE, '/ahead'),
    ]);
  });

  it('снимок новой закладки — из ответа сайта, без рейтинга — по источнику', () => {
    const result = plan({
      siteFolders: [siteFolder('reading', [item('/a', { contentRating: null })], READING)],
    });

    expect(result.bookmarkInserts[0]!.row).toMatchObject({
      titleId: titleIdOf(SOURCE, { id: 1, url: '/a' }),
      name: '/a',
      visitedAt: '2026-10-24T10:00:00.000Z',
    });
    expect(result.bookmarkInserts[0]!.row.contentRating).toBeDefined();
  });
});

describe('winsSiteProgress', () => {
  it('без отметки пишет при любой политике', () => {
    for (const policy of Object.values(RESTORE_PROGRESS_POLICY)) {
      expect(winsSiteProgress(policy, 5, undefined)).toBe(true);
    }
  });

  it('при расхождении решает политика', () => {
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.FURTHEST, 5, 3)).toBe(true);
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.FURTHEST, 3, 5)).toBe(false);
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.FURTHEST, 3, null)).toBe(false);
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.KEEP_MINE, 9, 3)).toBe(false);
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.FROM_BACKUP, 3, 9)).toBe(true);
    expect(winsSiteProgress(RESTORE_PROGRESS_POLICY.FROM_BACKUP, 3, 3)).toBe(false);
  });
});
