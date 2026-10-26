import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANCH_ID, SOURCE_IMPORT_PROGRESS_STATUS } from '@tanuki/contracts';
import { SourceAccountRequiredException, SourceUnavailableException } from '../common/errors';
import type { RawChapter } from '../parsers-client/parsers-client.types';
import { SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS, SOURCE_IMPORT_RELOGIN_WAIT_MS } from './models';
import { findChapterByNumber, getFailureUpdate } from './source-import-progress.service';

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

describe('findChapterByNumber', () => {
  it('ищет главу по номеру в основной ветке', () => {
    const chapters = [
      chapter({ id: 1, number: 5, branch: 'Команда A', uploadDate: 100 }),
      chapter({ id: 2, number: 5, branch: 'Команда B', uploadDate: 200 }),
      chapter({ id: 3, number: 6, branch: 'Команда B', uploadDate: 300 }),
    ];
    expect(findChapterByNumber(chapters, 5)?.id).toBe(2);
  });

  it('нет такой главы — null, отметка пропускается', () => {
    expect(findChapterByNumber([chapter({ number: 1 })], 7)).toBeNull();
    expect(findChapterByNumber([], 1)).toBeNull();
  });

  it('ветка без имени — тоже основная', () => {
    expect(findChapterByNumber([chapter({ number: 2 })], 2)?.branch ?? DEFAULT_BRANCH_ID).toBe(
      DEFAULT_BRANCH_ID,
    );
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
