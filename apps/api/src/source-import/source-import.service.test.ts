import { describe, expect, it } from 'vitest';
import type { TitleSnapshotsService } from '../library/title-snapshots.service';
import { RESTORE_FOLDER_POLICY, RESTORE_PROGRESS_POLICY } from '@tanuki/contracts';
import { RestoreInProgressException, SourceAccountRequiredException } from '../common/errors';
import type { DatabaseService } from '../database/database.service';
import type { BookmarkFoldersService } from '../library/bookmark-folders.service';
import { LibraryMergeService } from '../library/library-merge.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import { SourceImportService } from './source-import.service';

const REQUEST = {
  sourceId: 'mangalib',
  folderIds: ['reading'],
  folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
  progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
};

const createService = (getBookmarks: ParsersClientService['getBookmarks']) => {
  const reads: string[] = [];
  const tx = { execute: async () => [{ locked: false }] };
  const database = {
    db: { transaction: async (run: (value: typeof tx) => Promise<unknown>) => run(tx) },
  } as unknown as DatabaseService;
  const folders = { list: async () => [] } as unknown as BookmarkFoldersService;
  const parsersClient = {
    getBookmarks: async (sourceId: string) => {
      reads.push(sourceId);
      return getBookmarks(sourceId);
    },
  } as unknown as ParsersClientService;
  const service = new SourceImportService(
    database,
    folders,
    {} as TitleLinksService,
    {} as NotificationsService,
    new LibraryMergeService({} as TitleSnapshotsService),
    parsersClient,
  );
  return { service, reads };
};

describe('SourceImportService', () => {
  it('запись перечитывает сайт и при занятом замке отвечает 409, ничего не записав', async () => {
    const { service, reads } = createService(async () => []);
    await expect(service.import('user', REQUEST)).rejects.toBeInstanceOf(
      RestoreInProgressException,
    );
    expect(reads).toEqual(['mangalib']);
  });

  it('без аккаунта на сайте до записи не доходит', async () => {
    const { service } = createService(async (sourceId) => {
      throw new SourceAccountRequiredException(sourceId);
    });
    await expect(service.import('user', REQUEST)).rejects.toBeInstanceOf(
      SourceAccountRequiredException,
    );
    await expect(service.preview('user', 'mangalib')).rejects.toBeInstanceOf(
      SourceAccountRequiredException,
    );
  });
});
