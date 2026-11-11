import { describe, expect, it, vi } from 'vitest';
import type { TitleSnapshotsService } from '../library/title-snapshots.service';
import {
  DEFAULT_BRANCH_ID,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IMPORT_PROGRESS_STATUS,
} from '@tanuki/contracts';
import { SourceAccountRequiredException, SourceUnavailableException } from '../common/errors';
import { titleIdOf } from '../common/normalize';
import type { DatabaseService } from '../database/database.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS, SOURCE_IMPORT_RELOGIN_WAIT_MS } from './models';
import {
  findChapterByPosition,
  getFailureUpdate,
  toImportedProgress,
  SourceImportProgressService,
} from './source-import-progress.service';

const chapter = (overrides: Partial<RawChapter>): RawChapter =>
  ({
    id: 1,
    title: null,
    number: 1,
    volume: null,
    url: '/c',
    uploadDate: 0,
    branch: null,
    ...overrides,
  }) as RawChapter;

const at = (chapterNumber: number, chapterVolume: number | null = null) => ({
  chapterNumber,
  chapterVolume,
});

describe('findChapterByPosition', () => {
  it('ищет главу по номеру в основной ветке', () => {
    const chapters = [
      chapter({ id: 1, number: 5, branch: 'Команда A', uploadDate: 100 }),
      chapter({ id: 2, number: 5, branch: 'Команда B', uploadDate: 200 }),
      chapter({ id: 3, number: 6, branch: 'Команда B', uploadDate: 300 }),
    ];
    expect(findChapterByPosition(chapters, at(5))?.id).toBe(2);
  });

  it('нет такой главы — null, отметка пропускается', () => {
    expect(findChapterByPosition([chapter({ number: 1 })], at(7))).toBeNull();
    expect(findChapterByPosition([], at(1))).toBeNull();
  });

  it('номер ищется в томе с сайта — нумерация может начинаться заново', () => {
    const chapters = [
      chapter({ id: 1, number: 10, volume: 1 }),
      chapter({ id: 2, number: 10, volume: 5 }),
    ];
    expect(findChapterByPosition(chapters, at(10, 1))?.id).toBe(1);
    expect(findChapterByPosition(chapters, at(10, 5))?.id).toBe(2);
    expect(findChapterByPosition(chapters, at(10, 3))).toBeNull();
  });

  it('без тома с сайта неоднозначный номер не угадывается', () => {
    const chapters = [
      chapter({ id: 1, number: 10, volume: 1 }),
      chapter({ id: 2, number: 10, volume: 5 }),
      chapter({ id: 3, number: 11, volume: 5 }),
    ];
    expect(findChapterByPosition(chapters, at(10))).toBeNull();
    expect(findChapterByPosition(chapters, at(11))?.id).toBe(3);
  });

  it('порядок веток — по всем главам, а не по свежести найденной', () => {
    const chapters = [
      chapter({ id: 1, number: 5, branch: 'Команда A', uploadDate: 100 }),
      chapter({ id: 2, number: 6, branch: 'Команда A', uploadDate: 300 }),
      chapter({ id: 3, number: 5, branch: 'Команда B', uploadDate: 200 }),
    ];
    expect(findChapterByPosition(chapters, at(5))?.id).toBe(1);
  });

  it('без тома с сайта номер должен быть однозначен во всех ветках, а не в одной', () => {
    const chapters = [
      chapter({ id: 1, number: 10, volume: 1, branch: null }),
      chapter({ id: 2, number: 10, volume: 5, branch: null }),
      chapter({ id: 3, number: 10, volume: 5, branch: 'Другая команда' }),
      chapter({ id: 4, number: 12, volume: 5, branch: 'Другая команда' }),
      chapter({ id: 5, number: 12, volume: 5, branch: 'Третья команда' }),
    ];
    expect(findChapterByPosition(chapters, at(10))).toBeNull();
    expect(findChapterByPosition(chapters, at(12))?.id).toBe(4);
  });

  it('нет в основной ветке — ищется в других: команды переводчиков сменяются', () => {
    const chapters = [
      chapter({ id: 1, number: 10, volume: 5, branch: 'Поздняя команда' }),
      chapter({ id: 2, number: 11, volume: 5, branch: 'Поздняя команда' }),
      chapter({ id: 3, number: 10, volume: 1, branch: null }),
    ];
    expect(findChapterByPosition(chapters, at(10, 1))?.id).toBe(3);
    expect(findChapterByPosition(chapters, at(10, 5))?.id).toBe(1);
  });

  it('ветка без имени — тоже основная', () => {
    expect(
      findChapterByPosition([chapter({ number: 2 })], at(2))?.branch ?? DEFAULT_BRANCH_ID,
    ).toBe(DEFAULT_BRANCH_ID);
  });
});

describe('getFailureUpdate', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  it('сессия не принята — ждёт повторного входа, пока не прошли сутки', () => {
    const fresh = getFailureUpdate(
      { attempts: 0, createdAt: new Date(now.getTime() - 60_000) },
      now,
      new SourceAccountRequiredException('mangalib', true),
    );
    expect(fresh.status).toBe(SOURCE_IMPORT_PROGRESS_STATUS.WAITING_RELOGIN);
    expect(fresh.nextAttemptAt!.getTime()).toBeGreaterThan(now.getTime());

    const stale = getFailureUpdate(
      { attempts: 0, createdAt: new Date(now.getTime() - SOURCE_IMPORT_RELOGIN_WAIT_MS - 1) },
      now,
      new SourceAccountRequiredException('mangalib', true),
    );
    expect(stale.status).toBe(SOURCE_IMPORT_PROGRESS_STATUS.SKIPPED);
  });

  it('сбой источника — ещё попытка, после последней — пропуск', () => {
    const retry = getFailureUpdate(
      { attempts: 0, createdAt: now },
      now,
      new SourceUnavailableException(),
    );
    expect(retry).toMatchObject({ status: SOURCE_IMPORT_PROGRESS_STATUS.PENDING, attempts: 1 });

    const last = getFailureUpdate(
      { attempts: SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS - 1, createdAt: now },
      now,
      new Error('boom'),
    );
    expect(last).toMatchObject({
      status: SOURCE_IMPORT_PROGRESS_STATUS.SKIPPED,
      attempts: SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS,
    });
  });
});

describe('toImportedProgress', () => {
  it.each([null, 0, 7])(
    'сохраняет страницу %s, а при её отсутствии — начало главы',
    (pageIndex) => {
      const row = {
        id: 'pending',
        userId: 'user',
        sourceId: 'hentaichan_cc',
        titleKey: 'title-key',
        titleId: 'title-id',
        pageIndex,
      } as Parameters<typeof toImportedProgress>[0];
      expect(toImportedProgress(row, chapter({ number: 2 }))).toMatchObject({
        chapterNumber: 2,
        pageIndex: pageIndex ?? 0,
        titleKey: row.titleKey,
      });
    },
  );
});

describe('page progress completion', () => {
  it.each([1, 4])(
    'ограничивает страницу числом страниц и повторно проверяет политику (моя: %s)',
    async (minePage) => {
      const row: Parameters<typeof toImportedProgress>[0] = {
        id: 'pending',
        userId: 'user',
        sourceId: 'hentaichan_cc',
        titleKey: 'hentaichan_cc:title',
        titleId: titleIdOf('hentaichan_cc', { id: 6640, url: '6640,,test-release' }),
        importId: 'import',
        chapterNumber: 1,
        chapterVolume: null,
        pageIndex: 8,
        progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
        status: SOURCE_IMPORT_PROGRESS_STATUS.PENDING,
        attempts: 0,
        createdAt: new Date(),
        nextAttemptAt: new Date(),
      };
      const title = {
        title: 'Релиз',
        coverUrl: null,
        contentRating: null,
        chapters: [chapter({})],
      } as RawTitle;
      const select = vi
        .fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ orderBy: async () => [row] }) }) })
        .mockReturnValueOnce({
          from: () => ({
            where: async () => [
              {
                titleKey: row.titleKey,
                chapterNumber: 1,
                chapterVolume: null,
                pageIndex: minePage,
                updatedAt: new Date(),
              },
            ],
          }),
        })
        .mockReturnValueOnce({ from: () => ({ groupBy: () => ({ having: async () => [] }) }) });
      const values = vi.fn().mockReturnValue({ onConflictDoUpdate: async () => {} });
      const set = vi.fn().mockReturnValue({ where: async () => {} });
      const db = {
        select,
        insert: () => ({ values }),
        update: () => ({ set }),
        execute: async () => [],
        transaction: async <T>(run: (tx: unknown) => Promise<T>): Promise<T> => run(db),
      };
      const database = {
        db,
        withFallback: (fn: () => Promise<unknown>) => fn(),
      } as unknown as DatabaseService;
      const parsers = {
        getDetails: vi.fn().mockResolvedValue({ data: title }),
        getPages: vi.fn().mockResolvedValue({ data: { items: [{}, {}, {}] } }),
      } as unknown as ParsersClientService;
      const service = new SourceImportProgressService(
        database,
        parsers,
        { listConfirmedGroup: async () => [] } as unknown as TitleLinksService,
        {} as NotificationsService,
        { record: async () => {} } as unknown as TitleSnapshotsService,
      );
      await service.processDue();
      expect(parsers.getPages).toHaveBeenCalledWith(row.sourceId, '/c');
      if (minePage === 1)
        expect(values).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 2 }));
      else expect(values).not.toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith({ status: SOURCE_IMPORT_PROGRESS_STATUS.DONE });
    },
  );
});
