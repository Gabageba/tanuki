import { describe, expect, it } from 'vitest';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { AdultContentService } from '../adult-content/adult-content.service';
import { encodeChapterId, encodeTitleId } from '../common/opaque-id';
import type { DatabaseService } from '../database/database.service';
import type { Env } from '../config/env';
import type { BookmarksService } from '../library/bookmarks.service';
import type { TitleLinksService } from '../matches/title-links.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { SourcesService } from '../sources/sources.service';
import { isOnLastChapter, pickContinueReadingRows } from './continue-reading';
import type { ReadingProgressRow } from './models';
import {
  projectLinkedRow,
  ReadingProgressService,
  splitProgressRows,
} from './reading-progress.service';

const ENV = { IMG_SIGN_SECRET: 'secret-secret-secret' } as Env;

const row = (
  titleKey: string,
  sourceId: string,
  chapterNumber: number,
  updatedAt: string,
): ReadingProgressRow => ({
  userId: 'user',
  titleKey,
  sourceId,
  chapterId: `${sourceId}:chapter`,
  chapterVolume: null,
  chapterNumber,
  chapterTitle: null,
  branchId: 'default',
  pageIndex: 3,
  titleId: null,
  titleName: null,
  coverUrl: null,
  contentRating: null,
  type: null,
  hiddenAt: null,
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
    ENV,
    unavailable,
    links,
    parsersClient,
    adultContent,
    bookmarks,
    {} as SourcesService,
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

  it('«Продолжить чтение» при недоступной базе пустое, а «Убрать» — ошибка', async () => {
    await expect(service.listRecent('user')).resolves.toEqual({ items: [] });
    await expect(service.hideFromContinueReading('user', 'readmanga_ru', titleId)).rejects.toThrow(
      'Хранилище недоступно',
    );
  });
});

describe('pickContinueReadingRows', () => {
  const at = (iso: string) => new Date(iso);
  const shown = () => true;

  it('одна строка на группу совпадений — самая свежая', () => {
    const rows = [
      row('mangalib:/b', 'mangalib', 90, '2026-09-22T10:00:00Z'),
      row('desume:/c', 'desume', 40, '2026-09-21T10:00:00Z'),
      row('readmanga_ru:/a', 'readmanga_ru', 12, '2026-09-20T10:00:00Z'),
    ];
    const canonical = new Map([
      ['mangalib:/b', 'readmanga_ru:/a'],
      ['readmanga_ru:/a', 'readmanga_ru:/a'],
      ['desume:/c', 'desume:/c'],
    ]);

    const picked = pickContinueReadingRows(rows, canonical, shown);

    expect(picked.map(({ titleKey }) => titleKey)).toEqual(['mangalib:/b', 'desume:/c']);
  });

  it('убранный тайтл скрыт, пока его не читали снова', () => {
    const hidden = {
      ...row('desume:/c', 'desume', 40, '2026-09-21T10:00:00Z'),
      hiddenAt: at('2026-09-22T00:00:00Z'),
    };
    const readAgain = {
      ...row('mangalib:/b', 'mangalib', 91, '2026-09-23T10:00:00Z'),
      hiddenAt: at('2026-09-22T00:00:00Z'),
    };

    const picked = pickContinueReadingRows([readAgain, hidden], new Map(), shown);

    expect(picked.map(({ titleKey }) => titleKey)).toEqual(['mangalib:/b']);
  });

  it('тайтлы выключенных и скрытых источников не показываются', () => {
    const rows = [
      row('mangalib:/b', 'mangalib', 90, '2026-09-22T10:00:00Z'),
      row('desume:/c', 'desume', 40, '2026-09-21T10:00:00Z'),
    ];

    const picked = pickContinueReadingRows(rows, new Map(), (id) => id !== 'mangalib');

    expect(picked.map(({ sourceId }) => sourceId)).toEqual(['desume']);
  });
});

describe('isOnLastChapter', () => {
  const mark = (chapterVolume: number | null, chapterNumber: number) => ({
    ...row('readmanga_ru:/a', 'readmanga_ru', chapterNumber, '2026-09-20T10:00:00Z'),
    chapterVolume,
  });

  const latest = (volume: number | null, number: number, maxNumber = number) => ({
    volume,
    number,
    maxNumber,
  });

  it('последняя глава ветки — дочитано, есть следующая — нет', () => {
    expect(isOnLastChapter(mark(null, 12), latest(null, 12))).toBe(true);
    expect(isOnLastChapter(mark(null, 11), latest(null, 12))).toBe(false);
  });

  it('сравнивает сначала том, глава без тома — после всех томов', () => {
    expect(isOnLastChapter(mark(3, 60), latest(2, 60))).toBe(true);
    expect(isOnLastChapter(mark(2, 60), latest(3, 1, 60))).toBe(false);
    expect(isOnLastChapter(mark(5, 80), latest(null, 81))).toBe(false);
  });

  it('глава с большим номером в другом томе — не последняя', () => {
    expect(isOnLastChapter(mark(null, 100), latest(null, 100, 110))).toBe(false);
  });

  it('последняя глава неизвестна — тайтл остаётся в ленте', () => {
    expect(isOnLastChapter(mark(null, 12), undefined)).toBe(false);
  });
});

describe('ReadingProgressService.listRecent', () => {
  /** select()…limit() отдаёт строки, update()…where() — пишет снимок в журнал, execute() —
   *  последние главы. */
  const fakeDatabase = (
    rows: ReadingProgressRow[],
    updates: unknown[],
    latest: {
      title_key: string;
      chapter_volume: number | null;
      chapter_number: number;
      max_number: number;
    }[] = [],
  ) => {
    const chain = (result: unknown) => {
      const node: Record<string, unknown> = {};
      for (const method of ['from', 'where', 'orderBy', 'limit', 'set']) {
        node[method] = (value: unknown) => {
          if (method === 'set') updates.push(value);
          return node;
        };
      }
      node['then'] = (resolve: (value: unknown) => void) => resolve(result);
      return node;
    };
    return {
      withFallback: <T>(operation: () => Promise<T>) => operation(),
      db: {
        select: () => chain(rows),
        update: () => chain(undefined),
        execute: () => Promise.resolve(latest),
      },
    } as unknown as DatabaseService;
  };

  const sources = {
    listSources: () =>
      Promise.resolve([
        { id: 'readmanga_ru', isEnabled: true },
        { id: 'mangalib', isEnabled: false },
      ]),
  } as unknown as SourcesService;
  const links = {
    listCanonicalKeys: (keys: string[]) => Promise.resolve(new Map(keys.map((k) => [k, k]))),
  } as unknown as TitleLinksService;

  const withSnapshot = (titleKey: string, updatedAt: string) => ({
    ...row(titleKey, 'readmanga_ru', 5, updatedAt),
    titleId: `readmanga_ru:${titleKey}`,
    titleName: 'Есть снимок',
    coverUrl: 'https://cdn.example/cover.jpg',
    contentRating: 'safe' as const,
  });

  it('отдаёт снимок с подписанной обложкой, дописывает пропущенный и пропускает недоступное', async () => {
    const updates: unknown[] = [];
    const rows = [
      withSnapshot('readmanga_ru:/fresh', '2026-09-25T10:00:00Z'),
      row('readmanga_ru:/old', 'readmanga_ru', 3, '2026-09-24T10:00:00Z'),
      row('readmanga_ru:/gone', 'readmanga_ru', 1, '2026-09-23T10:00:00Z'),
      row('mangalib:/off', 'mangalib', 9, '2026-09-22T10:00:00Z'),
    ];
    const parsersClient = {
      getDetails: (_sourceId: string, url: string) =>
        url === '/old'
          ? Promise.resolve({
              data: { id: 1, url: '/old', title: 'Дописан', coverUrl: null, contentRating: null },
            })
          : Promise.reject(new Error('not found')),
    } as unknown as ParsersClientService;
    const service = new ReadingProgressService(
      ENV,
      fakeDatabase(rows, updates),
      links,
      parsersClient,
      {} as AdultContentService,
      {} as BookmarksService,
      sources,
    );

    const { items } = await service.listRecent('user');

    expect(items.map(({ title }) => title.name)).toEqual(['Есть снимок', 'Дописан']);
    expect(items[0]!.title.coverUrl).toContain('/img');
    expect(items[0]!.chapter).toMatchObject({ number: 5, id: 'readmanga_ru:chapter' });
    expect(items[1]!.title.id).toMatch(/^readmanga_ru:/);
    expect(updates).toEqual([expect.objectContaining({ titleName: 'Дописан' })]);
  });

  it('не показывает тайтлы, дочитанные до последней главы', async () => {
    const rows = [
      withSnapshot('readmanga_ru:/finished', '2026-09-25T10:00:00Z'),
      withSnapshot('readmanga_ru:/ongoing', '2026-09-24T10:00:00Z'),
    ];
    const latest = [
      {
        title_key: 'readmanga_ru:/finished',
        chapter_volume: null,
        chapter_number: 5,
        max_number: 5,
      },
      {
        title_key: 'readmanga_ru:/ongoing',
        chapter_volume: null,
        chapter_number: 6,
        max_number: 6,
      },
    ];
    const service = new ReadingProgressService(
      ENV,
      fakeDatabase(rows, [], latest),
      links,
      {} as ParsersClientService,
      {} as AdultContentService,
      {} as BookmarksService,
      sources,
    );

    const { items } = await service.listRecent('user');

    expect(items.map(({ title }) => title.id)).toEqual(['readmanga_ru:readmanga_ru:/ongoing']);
  });
});
