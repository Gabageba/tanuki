import { describe, expect, it } from 'vitest';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { AdultContentService } from '../adult-content/adult-content.service';
import { encodeChapterId, encodeTitleId } from '../common/opaque-id';
import type { DatabaseService } from '../database/database.service';
import type { BookmarksService } from '../library/bookmarks.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import {
  projectLinkedRow,
  ReadingProgressService,
  splitProgressRows,
} from './reading-progress.service';

const row = (titleKey: string, sourceId: string, chapterNumber: number, updatedAt: string) => ({
  userId: 'user',
  titleKey,
  sourceId,
  chapterId: `${sourceId}:chapter`,
  chapterVolume: null,
  chapterNumber,
  chapterTitle: null,
  branchId: 'default',
  pageIndex: 3,
  updatedAt: new Date(updatedAt),
});

describe('splitProgressRows', () => {
  it('отделяет отметку тайтла от отметок группы и сохраняет порядок свежести', () => {
    const rows = [
      row('mangalib:/b', 'mangalib', 90, '2026-09-22T10:00:00Z'),
      row('readmanga_ru:/a', 'readmanga_ru', 12, '2026-09-21T10:00:00Z'),
      row('desume:/c', 'desume', 40, '2026-09-20T10:00:00Z'),
    ];

    const result = splitProgressRows(rows, 'readmanga_ru:/a');

    expect(result.own).toMatchObject({ sourceId: 'readmanga_ru', chapterNumber: 12 });
    expect(result.linked.map((item) => item.sourceId)).toEqual(['mangalib', 'desume']);
  });

  it('без своей строки own — null', () => {
    const result = splitProgressRows(
      [row('mangalib:/b', 'mangalib', 1, '2026-09-22T10:00:00Z')],
      'x',
    );
    expect(result.own).toBeNull();
    expect(result.linked).toHaveLength(1);
  });
});

describe('projectLinkedRow', () => {
  const rawChapter = (
    id: number,
    number: number,
    volume: number | null,
    branch: string | null,
  ) => ({
    id,
    number,
    volume,
    title: null,
    url: `/c/${id}`,
    scanlator: null,
    uploadDate: 0,
    branch,
    source: 'test',
  });
  const markRow = {
    ...row('mangalib:/b', 'mangalib', 2, '2026-09-22T10:00:00Z'),
    chapterId: `mangalib:${encodeChapterId({ id: 12, url: '/c/12', branch: null })}`,
    chapterVolume: 2,
  };
  // На источнике отметки нумерация по томам: Т.2 Гл.2 — пятая глава по счёту.
  const source = [1, 2, 3].map((number) => rawChapter(number, number, 1, null));
  source.push(rawChapter(11, 1, 2, null), rawChapter(12, 2, 2, null));
  const target = [1, 2, 3, 4, 5, 6].flatMap((number) => [
    rawChapter(100 + number, number, 1, null),
    rawChapter(200 + number, number, 1, 'Команда'),
  ]);

  it('без общих ключей у разной нумерации — перевод номера, примерно и с отступом назад', () => {
    const projections = projectLinkedRow(markRow, source, target, 'readmanga_ru', 'title');
    // Т.2 Гл.2 — сквозная пятая; три главы отступа на неточность перевода — вторая.
    expect(projections.map((item) => item.chapterId).sort()).toEqual(
      [102, 202].map((id) =>
        expect.stringContaining(
          encodeChapterId({ id, url: `/c/${id}`, branch: id > 200 ? 'Команда' : null }),
        ),
      ),
    );
    expect(
      projections.every((item) => item.confidence === READING_MARK_CONFIDENCE.APPROXIMATE),
    ).toBe(true);
  });

  it('без списка источника узнаёт главу по снимку в каждой ветке', () => {
    const projections = projectLinkedRow(
      { ...markRow, chapterVolume: 1 },
      null,
      target,
      'readmanga_ru',
      'title',
    );
    expect(projections.map((item) => item.branchId).sort()).toEqual(['default', 'Команда']);
    expect(projections.every((item) => item.confidence === READING_MARK_CONFIDENCE.EXACT)).toBe(
      true,
    );
  });
});

describe('ReadingProgressService при недоступной базе', () => {
  const unavailable = {
    withFallback: <T>(_operation: () => Promise<T>, fallback: T) => Promise.resolve(fallback),
  } as unknown as DatabaseService;
  const links = { listConfirmedGroup: () => Promise.resolve([]) } as unknown as TitleLinksService;
  const parsersClient = {
    getDetails: () =>
      Promise.resolve({
        data: { chapters: [{ id: 7, number: 5, title: null, branch: null, url: '/c/5' }] },
      }),
  } as unknown as ParsersClientService;

  const adultContent = {
    getAccess: () => Promise.resolve({ showAdultSources: true, hideAdultTitles: false }),
  } as unknown as AdultContentService;

  const bookmarks = { touchVisit: () => Promise.resolve() } as unknown as BookmarksService;

  const service = new ReadingProgressService(
    unavailable,
    links,
    parsersClient,
    adultContent,
    bookmarks,
  );
  const titleId = encodeTitleId({ id: 1, url: '/title' });

  it('чтение отдаёт пустой прогресс, а не роняет страницу тайтла', async () => {
    await expect(service.get('user', 'readmanga_ru', titleId)).resolves.toEqual({
      own: null,
      linked: [],
    });
  });

  it('запись сообщает об ошибке, а не теряет отметку молча', async () => {
    const chapterId = `readmanga_ru:${encodeChapterId({ id: 7, url: '/c/5', branch: null })}`;
    await expect(
      service.update('user', 'readmanga_ru', titleId, { chapterId, pageIndex: 0 }),
    ).rejects.toThrow('Хранилище недоступно');
  });
});
