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
  const folders = { get: vi.fn().mockResolvedValue({ id: 'reading' }) };
  const service = new BookmarksService(
    {} as Env,
    { withFallback } as unknown as DatabaseService,
    folders as unknown as BookmarkFoldersService,
    { listConfirmedGroup: () => Promise.resolve([]) } as unknown as TitleLinksService,
    {} as TitleSnapshotsService,
    {} as SourcesService,
    {} as ParsersClientService,
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
