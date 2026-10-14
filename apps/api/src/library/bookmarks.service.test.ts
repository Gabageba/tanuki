import { describe, expect, it, vi } from 'vitest';
import {
  BOOKMARK_AVAILABILITY,
  CONTENT_RATING,
  SOURCE_STATUS,
  type Source,
} from '@tanuki/contracts';
import { BookmarkFolderConflictException } from '../common/errors';
import type { Env } from '../config/env';
import type { DatabaseService } from '../database/database.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { SourcesService } from '../sources/sources.service';
import type { BookmarkFoldersService } from './bookmark-folders.service';
import { orderByStaleness, selectTrackedKeys } from './bookmark-updates.service';
import { BookmarksService, toSourceAvailability } from './bookmarks.service';
import type { BookmarkRecord } from './models';
import type { TitleSnapshotsService } from './title-snapshots.service';

const row = (titleKey: string, folderId: string): BookmarkRecord => ({
  userId: 'user',
  titleKey,
  sourceId: titleKey.split(':')[0]!,
  titleId: `${titleKey}-id`,
  folderId,
  name: 'Ван Пис',
  coverUrl: null,
  contentRating: CONTENT_RATING.SAFE,
  type: null,
  visitedAt: new Date(0),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

/** База отдаёт строки закладок группы на первое чтение, а записи запоминает. */
const createService = (groupRows: BookmarkRecord[]) => {
  const withFallback = vi.fn().mockResolvedValueOnce(groupRows).mockResolvedValue(undefined);
  const folders = { get: vi.fn().mockResolvedValue({ id: 'reading', trackUpdates: true }) };
  const service = new BookmarksService(
    {} as Env,
    { withFallback } as unknown as DatabaseService,
    folders as unknown as BookmarkFoldersService,
    { listConfirmedGroup: () => Promise.resolve([]) } as unknown as TitleLinksService,
    {} as TitleSnapshotsService,
    {} as SourcesService,
    {} as ParsersClientService,
    { removeNewChapters: () => Promise.resolve() } as unknown as NotificationsService,
  );
  return { service, withFallback, folders };
};

describe('BookmarksService.prepareLinkMerge', () => {
  it('обе копии в разных папках и папка не выбрана — 409', async () => {
    const { service } = createService([row('a:/one', 'reading'), row('b:/one', 'planned')]);

    await expect(
      service.prepareLinkMerge('user', 'a:/one', 'b:/one', undefined),
    ).rejects.toBeInstanceOf(BookmarkFolderConflictException);
  });

  it('с выбранной папкой переносит всю новую группу после записи связи', async () => {
    const { service, withFallback, folders } = createService([
      row('a:/one', 'reading'),
      row('b:/one', 'planned'),
    ]);

    const merge = await service.prepareLinkMerge('user', 'a:/one', 'b:/one', 'reading');
    expect(folders.get).toHaveBeenCalledWith('user', 'reading');
    expect(withFallback).toHaveBeenCalledTimes(1);

    await merge();
    expect(withFallback).toHaveBeenCalledTimes(2);
  });

  it('в одной папке или не в закладках — склеивать нечего', async () => {
    const { service, withFallback } = createService([row('a:/one', 'reading')]);

    await (
      await service.prepareLinkMerge('user', 'a:/one', 'b:/one', undefined)
    )();

    expect(withFallback).toHaveBeenCalledTimes(1);
  });
});

describe('BookmarksService.listNewChapters', () => {
  /** Группа с посчитанными главами — как её отдаёт loadGroups. */
  const group = (key: string, newChaptersCount: number, latestNewAt: string | null) => ({
    key,
    folderId: 'reading',
    folderIds: ['reading'],
    snapshot: { ...row(key, 'reading'), name: key },
    target: {
      titleKey: key,
      sourceId: 'a',
      titleId: `${key}-id`,
      availability: BOOKMARK_AVAILABILITY.AVAILABLE,
    },
    otherSources: [],
    progress: null,
    visitedAt: new Date(0),
    createdAt: new Date(0),
    readAt: null,
    checkedAt: null,
    rows: [],
    branchTotal: 10,
    branchPosition: null,
    newChaptersCount,
    latestNewAt: latestNewAt ? new Date(latestNewAt) : null,
  });

  it('только группы с новыми главами, свежая глава первой, не больше восьми', async () => {
    const { service } = createService([]);
    const groups = [
      group('a:/old', 2, '2026-10-01T00:00:00Z'),
      group('a:/none', 0, null),
      group('a:/new', 5, '2026-10-10T00:00:00Z'),
      ...Array.from({ length: 10 }, (_, index) =>
        group(`a:/bulk-${index}`, 1, '2026-09-01T00:00:00Z'),
      ),
    ];
    vi.spyOn(service as unknown as { loadGroups: () => unknown }, 'loadGroups').mockResolvedValue({
      folders: [],
      groups,
    });

    const { items } = await service.listNewChapters('user');

    expect(items).toHaveLength(8);
    expect(items.slice(0, 2).map(({ name }) => name)).toEqual(['a:/new', 'a:/old']);
    expect(items.every(({ newChaptersCount }) => newChaptersCount > 0)).toBe(true);
  });
});

describe('toSourceAvailability', () => {
  const source = (overrides: Partial<Source>) =>
    ({ id: 'remanga', isEnabled: true, status: SOURCE_STATUS.OK, ...overrides }) as Source;

  it('скрытый настройкой 18+ источник (его нет в списке) — выключен', () => {
    expect(toSourceAvailability(undefined)).toBe(BOOKMARK_AVAILABILITY.SOURCE_DISABLED);
  });

  it('выключенный пользователем — выключен, лежащий — недоступен', () => {
    expect(toSourceAvailability(source({ isEnabled: false }))).toBe(
      BOOKMARK_AVAILABILITY.SOURCE_DISABLED,
    );
    expect(toSourceAvailability(source({ status: SOURCE_STATUS.DOWN }))).toBe(
      BOOKMARK_AVAILABILITY.SOURCE_DOWN,
    );
    expect(toSourceAvailability(source({ status: SOURCE_STATUS.DEGRADED }))).toBe(
      BOOKMARK_AVAILABILITY.AVAILABLE,
    );
  });
});

describe('очередь крона', () => {
  it('проверяет закладки и отметки чтения тех же групп, но не чужие отметки', () => {
    const canonical = new Map([
      ['a:/one', 'a:/one'],
      ['b:/one', 'a:/one'],
    ]);

    expect(
      selectTrackedKeys(
        [{ userId: 'u1', titleKey: 'a:/one' }],
        [
          { userId: 'u1', titleKey: 'b:/one' },
          { userId: 'u1', titleKey: 'c:/two' },
          { userId: 'u2', titleKey: 'b:/one' },
        ],
        canonical,
      ).sort(),
    ).toEqual(['a:/one', 'b:/one']);
  });

  it('сначала ни разу не проверенные, потом давно проверенные', () => {
    expect(
      orderByStaleness(
        ['fresh', 'never', 'stale'],
        new Map([
          ['fresh', new Date(2000)],
          ['stale', new Date(1000)],
        ]),
      ),
    ).toEqual(['never', 'stale', 'fresh']);
  });
});
