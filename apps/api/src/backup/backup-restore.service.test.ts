import { describe, expect, it, vi } from 'vitest';
import type { TitleSnapshotsService } from '../library/title-snapshots.service';
import {
  BACKUP_FORMAT,
  BUILT_IN_BOOKMARK_FOLDER,
  BACKUP_VERSION,
  BackupSchema,
  DEFAULT_READER_SETTINGS,
  READER_DIRECTION,
  READER_PAGE_LAYOUT,
  RestoreBackupRequestSchema,
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
import { LibraryMergeService } from '../library/library-merge.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { toUserSettingsWrite } from './backup-settings';
import { BackupRestoreService } from './backup-restore.service';
import { readerSettings, userSettings } from '../database/schema';

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
    new LibraryMergeService({} as TitleSnapshotsService),
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

describe('настройки читалки в резервной копии', () => {
  it('устаревший фон не восстанавливается из резервной копии', () => {
    const backup = {
      ...BACKUP,
      settings: {
        ...BACKUP.settings,
        reader: { ...DEFAULT_READER_SETTINGS, background: 'paper' },
      },
    };
    expect(BackupSchema.parse(backup).settings.reader).toEqual(DEFAULT_READER_SETTINGS);
  });
  it('копия версии 1 без новых полей восстанавливается с умолчаниями', () => {
    const {
      direction: _direction,
      pageLayout: _pageLayout,
      brightness: _brightness,
      prefetchPages: _prefetch,
      keepScreenOn: _wake,
      ...legacy
    } = DEFAULT_READER_SETTINGS;
    const request = RestoreBackupRequestSchema.parse({
      ...REQUEST,
      applySettings: true,
      backup: { ...BACKUP, settings: { ...BACKUP.settings, reader: legacy } },
    });
    expect(request.backup.settings.reader).toEqual(DEFAULT_READER_SETTINGS);
    expect(request.applySettings).toBe(true);
  });
  it('новая копия сохраняет выбранные значения без потерь', () => {
    const reader = {
      ...DEFAULT_READER_SETTINGS,
      direction: READER_DIRECTION.RTL,
      pageLayout: READER_PAGE_LAYOUT.SPREAD,
      brightness: 20,
      prefetchPages: 0,
      keepScreenOn: true,
    };
    const backup = { ...BACKUP, settings: { ...BACKUP.settings, reader } };
    expect(BackupSchema.parse(JSON.parse(JSON.stringify(backup))).settings.reader).toEqual(reader);
  });
  it('совместимость старой копии не ослабляет проверку существующих настроек и остальных данных', () => {
    expect(
      BackupSchema.safeParse({
        ...BACKUP,
        settings: { ...BACKUP.settings, reader: { ...DEFAULT_READER_SETTINGS, containerWidth: 1 } },
      }).success,
    ).toBe(false);
    expect(BackupSchema.safeParse({ ...BACKUP, exportedAt: 'yesterday' }).success).toBe(false);
    expect(
      BackupSchema.safeParse({
        ...BACKUP,
        settings: { ...BACKUP.settings, reader: { ...DEFAULT_READER_SETTINGS, brightness: 0 } },
      }).success,
    ).toBe(false);
  });
});

describe('восстановление старых настроек читалки', () => {
  it('пишет умолчания новых полей в базу при полном восстановлении', async () => {
    const readerWrite = vi.fn();
    const tx = {
      execute: async () => [{ locked: true }],
      select: () => ({
        from: (table: unknown) => ({
          where: () => {
            const rows = table === userSettings ? [{ ageConfirmed: false }] : [];
            return Object.assign(Promise.resolve(rows), { limit: async () => rows });
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: (values: unknown) => {
          if (table === readerSettings) readerWrite(values);
          return { onConflictDoUpdate: async () => undefined };
        },
      }),
      delete: () => ({ where: async () => undefined }),
    };
    const database = {
      db: { transaction: async (run: (value: typeof tx) => Promise<unknown>) => run(tx) },
    } as unknown as DatabaseService;
    const folders = {
      list: async () => [
        {
          id: 'planned',
          builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
          position: 0,
          trackUpdates: true,
        },
      ],
    } as unknown as BookmarkFoldersService;
    const links = { listCanonicalKeys: async () => new Map() } as unknown as TitleLinksService;
    const service = new BackupRestoreService(
      database,
      folders,
      links,
      {} as NotificationsService,
      new LibraryMergeService({} as TitleSnapshotsService),
    );
    const legacy = Object.fromEntries(
      Object.entries(DEFAULT_READER_SETTINGS).filter(
        ([key]) =>
          !['direction', 'pageLayout', 'brightness', 'prefetchPages', 'keepScreenOn'].includes(key),
      ),
    );
    const request = RestoreBackupRequestSchema.parse({
      ...REQUEST,
      applySettings: true,
      backup: { ...BACKUP, settings: { ...BACKUP.settings, reader: legacy } },
    });
    await service.restore('user', request);
    expect(readerWrite).toHaveBeenCalledWith({ userId: 'user', ...DEFAULT_READER_SETTINGS });
  });
});
