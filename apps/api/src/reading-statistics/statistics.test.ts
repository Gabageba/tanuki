import { describe, expect, it } from 'vitest';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { toCanonicalKeys } from '../matches/title-links.service';
import type { ActivityMinute, ChapterRead } from './models';
import {
  computeAverageSessionSeconds,
  computeTags,
  computePeak,
  computeReadingTime,
  computeStatistics,
  computeStreak,
  dedupeChapterReads,
  toLocalParts,
} from './statistics';

const read = (
  overrides: Partial<Omit<ChapterRead, 'readAt'>> & { readAt: string },
): ChapterRead => ({
  chapterId: `${overrides.sourceId ?? 'a'}:${overrides.chapterNumber ?? 1}`,
  sourceId: 'a',
  titleKey: 'a:/title',
  chapterVolume: null,
  chapterNumber: 1,
  tags: [],
  ...overrides,
  readAt: new Date(overrides.readAt),
});

const minute = (iso: string, seconds = 60): ActivityMinute => ({ minute: new Date(iso), seconds });

describe('toCanonicalKeys', () => {
  it('склеивает цепочку подтверждений в одну группу', () => {
    const keys = toCanonicalKeys(
      ['b', 'c'],
      [
        { aId: 'a', bId: 'b', verdict: TITLE_LINK_VERDICT.CONFIRMED },
        { aId: 'b', bId: 'c', verdict: TITLE_LINK_VERDICT.CONFIRMED },
      ],
    );
    expect(keys.get('b')).toBe('a');
    expect(keys.get('c')).toBe('a');
  });

  it('прямой отказ исключает тайтл из группы', () => {
    const keys = toCanonicalKeys(
      ['c'],
      [
        { aId: 'a', bId: 'b', verdict: TITLE_LINK_VERDICT.CONFIRMED },
        { aId: 'b', bId: 'c', verdict: TITLE_LINK_VERDICT.CONFIRMED },
        { aId: 'a', bId: 'c', verdict: TITLE_LINK_VERDICT.REJECTED },
      ],
    );
    expect(keys.get('c')).toBe('b');
  });

  it('тайтл без связей — сам себе группа', () => {
    expect(toCanonicalKeys(['x'], []).get('x')).toBe('x');
  });
});

describe('dedupeChapterReads', () => {
  const reads = [
    read({ sourceId: 'b', titleKey: 'b:/title', chapterNumber: 5, readAt: '2026-09-10T10:00:00Z' }),
    read({ sourceId: 'a', titleKey: 'a:/title', chapterNumber: 5, readAt: '2026-09-01T10:00:00Z' }),
  ];

  it('одна глава на связанных источниках считается один раз — по первому прочтению', () => {
    const canonical = new Map([
      ['a:/title', 'a:/title'],
      ['b:/title', 'a:/title'],
    ]);
    const result = dedupeChapterReads(reads, canonical);
    expect(result).toHaveLength(1);
    expect(result[0]!.sourceId).toBe('a');
  });

  it('после отказа от связи главы снова считаются раздельно', () => {
    expect(dedupeChapterReads(reads, new Map())).toHaveLength(2);
  });

  it('главы без номера не склеиваются между собой', () => {
    const unnumbered = [
      read({ chapterId: 'a:x', chapterNumber: null, readAt: '2026-09-01T10:00:00Z' }),
      read({ chapterId: 'a:y', chapterNumber: null, readAt: '2026-09-01T11:00:00Z' }),
    ];
    expect(dedupeChapterReads(unnumbered, new Map())).toHaveLength(2);
  });
});

describe('toLocalParts', () => {
  it('в Москве 22:30 UTC — уже следующий день', () => {
    const date = new Date('2026-09-27T22:30:00Z');
    expect(toLocalParts(date, 'UTC').date).toBe('2026-09-27');
    expect(toLocalParts(date, 'Europe/Moscow')).toEqual({ date: '2026-09-28', hour: 1 });
  });
});

describe('computeStreak', () => {
  it('сегодня ещё не читали — серия считается до вчера', () => {
    const dates = new Set(['2026-09-25', '2026-09-26', '2026-09-27']);
    expect(computeStreak(dates, '2026-09-28')).toEqual({ current: 3, best: 3 });
  });

  it('пропущенный день рвёт серию, рекорд остаётся', () => {
    const dates = new Set(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-05', '2026-09-28']);
    expect(computeStreak(dates, '2026-09-28')).toEqual({ current: 1, best: 3 });
  });

  it('позавчерашнее чтение серию не держит', () => {
    expect(computeStreak(new Set(['2026-09-26']), '2026-09-28').current).toBe(0);
  });
});

describe('computePeak', () => {
  it('находит окно через полночь', () => {
    const hours = Array.from({ length: 24 }, () => 0);
    hours[23] = 300;
    hours[0] = 300;
    hours[12] = 400;
    expect(computePeak(hours)).toEqual({ fromHour: 23, percent: 60 });
  });

  it('без чтения пика нет', () => {
    expect(computePeak(Array.from({ length: 24 }, () => 0))).toBeNull();
  });
});

describe('computeAverageSessionSeconds', () => {
  it('пауза больше 15 минут начинает новую сессию', () => {
    const minutes = [
      minute('2026-09-28T10:00:00Z'),
      minute('2026-09-28T10:10:00Z'), // пауза 9 минут — та же сессия
      minute('2026-09-28T10:30:00Z'), // пауза 19 минут — новая
    ];
    expect(computeAverageSessionSeconds(minutes)).toBe(90);
  });
});

describe('computeReadingTime', () => {
  it('делит время на прошедшие будни и выходные месяца', () => {
    // 1–3 сентября 2026: вт, ср, чт — выходных ещё не было.
    const result = computeReadingTime(
      [
        minute('2026-09-01T10:00:00Z'),
        minute('2026-09-03T10:00:00Z'),
        minute('2026-08-31T10:00:00Z'),
      ],
      'UTC',
      '2026-09-03',
    );
    expect(result.totalMinutes).toBe(2);
    expect(result.weekdaysPerDayMinutes).toBe(1);
    expect(result.weekendsPerDayMinutes).toBe(0);
  });
});

describe('computeTags', () => {
  it('сливает теги по нормализованному имени', () => {
    const tags = computeTags([
      read({ tags: ['Фэнтези', 'Экшен'], readAt: '2026-09-01T10:00:00Z' }),
      read({ tags: ['фэнтези '], readAt: '2026-09-02T10:00:00Z' }),
    ]);
    expect(tags[0]).toEqual({ name: 'Фэнтези', chapters: 2 });
  });
});

describe('computeStatistics', () => {
  it('без базы сравнения среднее — ноль', () => {
    const result = computeStatistics({
      reads: [read({ readAt: '2026-09-28T10:00:00Z' })],
      activity: [],
      canonicalKeys: new Map(),
      timeZone: 'UTC',
      now: new Date('2026-09-28T12:00:00Z'),
    });
    expect(result.today).toEqual({ chapters: 1, averagePerDay: 0 });
    expect(result.month).toEqual({ chapters: 1, daysElapsed: 28, baselinePerDay: 0 });
    expect(result.chaptersByDay).toHaveLength(30);
    expect(result.chaptersByDay.at(-1)).toEqual({ date: '2026-09-28', count: 1 });
    expect(result.chaptersByMonth.at(-1)).toEqual({ date: '2026-09-01', count: 1 });
    expect(result.chaptersByMonth[0]!.date).toBe('2025-10-01');
  });

  it('пустая история — нет активности', () => {
    const result = computeStatistics({
      reads: [],
      activity: [],
      canonicalKeys: new Map(),
      timeZone: 'UTC',
      now: new Date('2026-09-28T12:00:00Z'),
    });
    expect(result.hasActivity).toBe(false);
    expect(result.streak).toEqual({ current: 0, best: 0 });
  });
});
