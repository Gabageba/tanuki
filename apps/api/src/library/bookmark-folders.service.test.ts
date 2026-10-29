import { describe, expect, it, vi } from 'vitest';
import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
} from '@tanuki/contracts';
import {
  BookmarkFolderLimitException,
  BookmarkFolderNameTakenException,
  BuiltInBookmarkFolderReadonlyException,
} from '../common/errors';
import type { DatabaseService } from '../database/database.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { bookmarkFolders, bookmarks } from '../database/schema';
import {
  BookmarkFoldersService,
  changesBuiltInLook,
  isCompleteOrder,
  isReservedFolderName,
  isTrackedByDefault,
  type BookmarkFolderRecord,
} from './bookmark-folders.service';

const folder = (overrides: Partial<BookmarkFolderRecord>): BookmarkFolderRecord => ({
  id: 'folder',
  userId: 'user',
  builtIn: null,
  name: 'Избранное',
  icon: BOOKMARK_FOLDER_ICON.STAR,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  position: 4,
  trackUpdates: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...overrides,
});

const NEW_FOLDER = {
  name: 'Избранное',
  icon: BOOKMARK_FOLDER_ICON.STAR,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  trackUpdates: true,
};

/** Запись в транзакции: какая таблица и что с ней сделали. */
type TxCall = { table: unknown; action: 'update' | 'delete'; values?: unknown };

const createService = () => {
  const calls: TxCall[] = [];
  const tx = {
    update: (table: unknown) => ({
      set: (values: unknown) => {
        calls.push({ table, action: 'update', values });
        return { where: () => undefined };
      },
    }),
    delete: (table: unknown) => {
      calls.push({ table, action: 'delete' });
      return { where: () => undefined };
    },
  };
  const database = {
    db: {
      transaction: (callback: (value: typeof tx) => Promise<void>) => callback(tx),
      // Закладки папки: ключи, у которых надо убрать «новые главы» из ленты.
      select: () => ({ from: () => ({ where: () => Promise.resolve([{ titleKey: 'a:/one' }]) }) }),
    },
  } as unknown as DatabaseService;
  const removeNewChapters = vi.fn().mockResolvedValue(undefined);
  return {
    service: new BookmarkFoldersService(
      database,
      {
        listCanonicalKeys: async () => new Map([['a:/one', 'b:/one']]),
      } as unknown as TitleLinksService,
      { removeNewChapters } as unknown as NotificationsService,
    ),
    calls,
    removeNewChapters,
  };
};

describe('правила папок', () => {
  it('«Брошено» по умолчанию не отслеживается, остальные встроенные — да', () => {
    expect(isTrackedByDefault(BUILT_IN_BOOKMARK_FOLDER.DROPPED)).toBe(false);
    expect(isTrackedByDefault(BUILT_IN_BOOKMARK_FOLDER.READING)).toBe(true);
    expect(isTrackedByDefault(BUILT_IN_BOOKMARK_FOLDER.FAVORITE)).toBe(true);
    expect(isTrackedByDefault(BUILT_IN_BOOKMARK_FOLDER.ON_HOLD)).toBe(true);
  });

  it('название встроенной папки на любом языке занято, без учёта регистра и пробелов', () => {
    expect(isReservedFolderName('  ЧИТАЮ ')).toBe(true);
    expect(isReservedFolderName('Dropped')).toBe(true);
    expect(isReservedFolderName('  ЛЮБИМОЕ ')).toBe(true);
    expect(isReservedFolderName('Favorites')).toBe(true);
    expect(isReservedFolderName('  ОТЛОЖЕНО ')).toBe(true);
    expect(isReservedFolderName('On hold')).toBe(true);
    expect(isReservedFolderName('Избранное')).toBe(false);
  });

  it('у встроенной папки меняется только флаг', () => {
    expect(changesBuiltInLook({ trackUpdates: false })).toBe(false);
    expect(changesBuiltInLook({ name: 'Новое' })).toBe(true);
    expect(changesBuiltInLook({ color: BOOKMARK_FOLDER_COLOR.PINK })).toBe(true);
  });

  it('порядок принимается, только если перечисляет ровно все папки', () => {
    expect(isCompleteOrder(['b', 'a'], ['a', 'b'])).toBe(true);
    expect(isCompleteOrder(['a'], ['a', 'b'])).toBe(false);
    expect(isCompleteOrder(['a', 'a'], ['a', 'b'])).toBe(false);
    expect(isCompleteOrder(['a', 'c'], ['a', 'b'])).toBe(false);
  });
});

describe('BookmarkFoldersService', () => {
  it.each([
    { name: 'новому пользователю создаёт все системные папки', existing: [] },
    {
      name: 'добавляет «Отложено» после существующих папок, сохраняя их порядок и слежение',
      existing: [
        ...Object.values(BUILT_IN_BOOKMARK_FOLDER)
          .filter((builtIn) => builtIn !== BUILT_IN_BOOKMARK_FOLDER.ON_HOLD)
          .map((builtIn, position) =>
            folder({ id: builtIn, builtIn, name: null, position, trackUpdates: false }),
          ),
        folder({ id: 'custom', name: 'Перечитать', position: 12 }),
      ],
    },
    {
      name: 'не создаёт системные папки повторно',
      existing: Object.values(BUILT_IN_BOOKMARK_FOLDER).map((builtIn, position) =>
        folder({ id: builtIn, builtIn, name: null, position }),
      ),
    },
  ])('$name', async ({ existing }) => {
    const values = vi.fn(() => ({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }));
    const insert = vi.fn(() => ({ values }));
    const select = vi
      .fn()
      .mockReturnValueOnce({ from: () => ({ where: async () => existing }) })
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ orderBy: async () => existing }) }),
      });
    const service = new BookmarkFoldersService(
      { db: { select, insert } } as unknown as DatabaseService,
      {} as TitleLinksService,
      {} as NotificationsService,
    );

    await service.list('user');

    if (existing.length === 0) {
      expect(values).toHaveBeenCalledWith(
        Object.values(BUILT_IN_BOOKMARK_FOLDER).map((builtIn, position) => ({
          userId: 'user',
          builtIn,
          position,
          trackUpdates: builtIn !== BUILT_IN_BOOKMARK_FOLDER.DROPPED,
        })),
      );
    } else if (existing.some(({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.ON_HOLD)) {
      expect(insert).not.toHaveBeenCalled();
    } else {
      expect(values).toHaveBeenCalledWith([
        {
          userId: 'user',
          builtIn: BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
          position: 13,
          trackUpdates: true,
        },
      ]);
    }
  });

  it(`не создаёт ${CUSTOM_BOOKMARK_FOLDERS_LIMIT + 1}-ю свою папку`, async () => {
    const { service } = createService();
    const custom = Array.from({ length: CUSTOM_BOOKMARK_FOLDERS_LIMIT }, (_, index) =>
      folder({ id: `custom-${index}`, name: `Папка ${index}` }),
    );
    vi.spyOn(service, 'list').mockResolvedValue([
      folder({ id: 'reading', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, name: null }),
      ...custom,
    ]);

    await expect(service.create('user', NEW_FOLDER)).rejects.toBeInstanceOf(
      BookmarkFolderLimitException,
    );
  });

  it('не создаёт папку с названием встроенной', async () => {
    const { service } = createService();

    await expect(
      service.create('user', { ...NEW_FOLDER, name: 'В планах' }),
    ).rejects.toBeInstanceOf(BookmarkFolderNameTakenException);
  });

  it('не переименовывает встроенную папку', async () => {
    const { service } = createService();
    vi.spyOn(service, 'get').mockResolvedValue(
      folder({ id: 'reading', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, name: null }),
    );

    await expect(
      service.update('user', 'reading', { name: 'Читаю сейчас' }),
    ).rejects.toBeInstanceOf(BuiltInBookmarkFolderReadonlyException);
  });

  it('не удаляет встроенную папку', async () => {
    const { service } = createService();
    vi.spyOn(service, 'get').mockResolvedValue(
      folder({ id: 'planned', builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED, name: null }),
    );

    await expect(service.delete('user', 'planned', undefined)).rejects.toBeInstanceOf(
      BuiltInBookmarkFolderReadonlyException,
    );
  });

  it('удаляя папку с moveTo, переносит её закладки, а не удаляет их', async () => {
    const { service, calls } = createService();
    vi.spyOn(service, 'get').mockImplementation((_, id) =>
      Promise.resolve(
        id === 'planned'
          ? folder({ id, builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED, name: null })
          : folder({ id }),
      ),
    );

    await service.delete('user', 'folder', 'planned');

    expect(calls.map(({ table, action }) => [table, action])).toEqual([
      [bookmarks, 'update'],
      [bookmarkFolders, 'delete'],
    ]);
    expect(calls[0]?.values).toMatchObject({ folderId: 'planned' });
  });

  it('удаляя папку без moveTo, удаляет и её закладки', async () => {
    const { service, calls } = createService();
    vi.spyOn(service, 'get').mockResolvedValue(folder({ id: 'folder' }));

    await service.delete('user', 'folder', undefined);

    expect(calls.map(({ table, action }) => [table, action])).toEqual([
      [bookmarks, 'delete'],
      [bookmarkFolders, 'delete'],
    ]);
  });

  it('удаляя папку без moveTo, убирает новые главы её закладок из ленты', async () => {
    const { service, removeNewChapters } = createService();
    vi.spyOn(service, 'get').mockResolvedValue(folder({ id: 'folder' }));

    await service.delete('user', 'folder', undefined);

    expect(removeNewChapters).toHaveBeenCalledWith('user', ['a:/one', 'b:/one']);
  });

  it('перенос в папку со слежением ленту не трогает', async () => {
    const { service, removeNewChapters } = createService();
    vi.spyOn(service, 'get').mockImplementation((_, id) =>
      Promise.resolve(folder({ id, trackUpdates: true })),
    );

    await service.delete('user', 'folder', 'planned');

    expect(removeNewChapters).not.toHaveBeenCalled();
  });

  it('выключая слежение, убирает новые главы закладок папки из ленты', async () => {
    const { service, removeNewChapters } = createService();
    vi.spyOn(service, 'get').mockResolvedValue(folder({ id: 'folder' }));
    (service as unknown as { runUnique: unknown }).runUnique = () => Promise.resolve([folder({})]);

    await service.update('user', 'folder', { trackUpdates: false });

    expect(removeNewChapters).toHaveBeenCalledWith('user', ['a:/one', 'b:/one']);
  });
});
