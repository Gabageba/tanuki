import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  COLOR_SCHEME,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IDS,
  type Backup,
  type BackupSettings,
} from '@tanuki/contracts';
import { BackupVersionUnsupportedException, RestoreInProgressException } from '../common/errors';
import type { DatabaseService } from '../database/database.service';
import type { BookmarkFoldersService } from '../library/bookmark-folders.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { toUserSettingsWrite } from './backup-settings';
import { BackupRestoreService } from './backup-restore.service';

const [SOURCE_A, SOURCE_B] = SOURCE_IDS as [string, string];
const KNOWN = new Set([SOURCE_A, SOURCE_B]);

const BACKUP: Backup = {
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: '2026-10-12T10:00:00Z',
  origin: 'https://tanuki.example.com',
  username: 'gabageba',
  settings: { user: {}, sourceOrder: null, reader: null, disabledSources: [] },
  folders: [],
  bookmarks: [],
  progress: [],
  chapterReads: [],
  readingActivity: [],
};

const REQUEST = {
  backup: BACKUP,
  folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
  progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
  applySettings: false,
};

/** Сервис, у которого транзакция сразу упирается в занятый лок пользователя. */
const createLockedService = () => {
  const tx = { execute: async () => [{ locked: false }] };
  const database = {
    db: { transaction: async (run: (value: typeof tx) => Promise<unknown>) => run(tx) },
  } as unknown as DatabaseService;
  const folders = { list: async () => [] } as unknown as BookmarkFoldersService;
  return new BackupRestoreService(
    database,
    folders,
    {} as TitleLinksService,
    {} as NotificationsService,
  );
};

describe('BackupRestoreService', () => {
  it('второе восстановление параллельно отвечает 409, ничего не записав', async () => {
    await expect(createLockedService().restore('user', REQUEST)).rejects.toBeInstanceOf(
      RestoreInProgressException,
    );
  });

  it('копию новее поддерживаемой версии не разбирает', async () => {
    const newer = { ...BACKUP, version: BACKUP_VERSION + 1 };
    await expect(
      createLockedService().restore('user', { ...REQUEST, backup: newer }),
    ).rejects.toBeInstanceOf(BackupVersionUnsupportedException);
    await expect(createLockedService().preview('user', newer)).rejects.toBeInstanceOf(
      BackupVersionUnsupportedException,
    );
  });
});

describe('toUserSettingsWrite', () => {
  const settings = (overrides: Partial<BackupSettings>): BackupSettings => ({
    user: {},
    sourceOrder: null,
    reader: null,
    disabledSources: [],
    ...overrides,
  });

  it('заменяет общие настройки целиком и не пишет подтверждение возраста', () => {
    const values = toUserSettingsWrite(
      settings({ user: { colorScheme: COLOR_SCHEME.DARK, ageConfirmed: true } as never }),
      KNOWN,
      true,
    );
    expect(values.colorScheme).toBe(COLOR_SCHEME.DARK);
    expect(values.viewMode).toBeNull();
    expect('ageConfirmed' in values).toBe(false);
  });

  it('берёт настройки 18+ из копии, только если возраст здесь уже подтверждён', () => {
    const adult = settings({ user: { showAdultSources: true, hideAdultTitles: false } });

    const confirmed = toUserSettingsWrite(adult, KNOWN, true);
    expect(confirmed).toMatchObject({ showAdultSources: true, hideAdultTitles: false });

    const unconfirmed = toUserSettingsWrite(adult, KNOWN, false);
    expect('showAdultSources' in unconfirmed).toBe(false);
    expect('hideAdultTitles' in unconfirmed).toBe(false);
  });

  it('отбрасывает источники и блоки подборок, которых нет на инстансе', () => {
    const values = toUserSettingsWrite(
      settings({
        sourceOrder: ['gone', SOURCE_B, SOURCE_A],
        user: {
          collapsedSearchSources: [SOURCE_A, 'gone'],
          selectionsDisabledSections: [`${SOURCE_A}:popular`, 'gone:popular'],
        },
      }),
      KNOWN,
      true,
    );
    expect(values.sourceOrder).toEqual([SOURCE_B, SOURCE_A]);
    expect(values.collapsedSearchSources).toEqual([SOURCE_A]);
    expect(values.selectionsDisabledSections).toEqual([`${SOURCE_A}:popular`]);
  });
});
