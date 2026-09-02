import { describe, expect, it } from 'vitest';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_RESTRICTION,
  MANGA_TYPE,
  SOURCE_ID,
} from '@tanuki/contracts';
import {
  computeBranches,
  normalizeChapter,
  normalizeFilterGroup,
  normalizeManga,
  pickDefaultBranch,
} from './normalize';
import type { RawChapter, RawFilterGroup, RawManga } from '../parsers-client/parsers-client.types';

const ENV = { IMG_SIGN_SECRET: 'a'.repeat(32) };

const raw = (overrides: Partial<RawManga> = {}): RawManga => {
  return {
    id: 1,
    title: 'Title',
    altTitles: [],
    url: '/manga/1',
    publicUrl: 'https://example.com/manga/1',
    rating: -1,
    contentRating: null,
    coverUrl: null,
    tags: [],
    state: null,
    authors: [],
    largeCoverUrl: null,
    description: null,
    chapters: null,
    source: SOURCE_ID.DESUME,
    ...overrides,
  };
};

const chapter = (overrides: Partial<RawChapter> = {}): RawChapter => {
  return {
    id: 1,
    title: null,
    number: 0,
    volume: 0,
    url: '/manga/1/ch1',
    scanlator: null,
    uploadDate: 0,
    branch: null,
    source: SOURCE_ID.DESUME,
    ...overrides,
  };
};

describe('normalizeManga', () => {
  it('maps RATING_UNKNOWN (-1) to null, otherwise scales the 0..1 raw rating up to 0..10', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ rating: -1 })).rating).toBeNull();
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ rating: 0.42 })).rating).toBe(4.2);
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ rating: 0.865 })).rating).toBe(8.65);
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ rating: 0 })).rating).toBe(0);
  });

  it('passes likes through, defaulting to null when the parser omits them', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({})).likes).toBeNull();
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ likes: 46 })).likes).toBe(46);
  });

  it('passes type/year through, defaulting to null when the parser omits them', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({})).type).toBeNull();
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({})).year).toBeNull();
    expect(
      normalizeManga(ENV, SOURCE_ID.DESUME, raw({ type: MANGA_TYPE.MANHWA, year: 2024 })).type,
    ).toBe(MANGA_TYPE.MANHWA);
    expect(
      normalizeManga(ENV, SOURCE_ID.DESUME, raw({ type: MANGA_TYPE.MANHWA, year: 2024 })).year,
    ).toBe(2024);
  });

  it('defaults a null contentRating to SAFE', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ contentRating: null })).contentRating).toBe(
      CONTENT_RATING.SAFE,
    );
    expect(
      normalizeManga(ENV, SOURCE_ID.DESUME, raw({ contentRating: CONTENT_RATING.ADULT }))
        .contentRating,
    ).toBe(CONTENT_RATING.ADULT);
  });

  it('passes restriction through, defaulting to null when the parser omits it', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({})).restriction).toBeNull();
    expect(
      normalizeManga(ENV, SOURCE_ID.DESUME, raw({ restriction: MANGA_RESTRICTION.LEGAL }))
        .restriction,
    ).toBe(MANGA_RESTRICTION.LEGAL);
  });

  it('turns a null coverUrl into an empty string, never null', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ coverUrl: null })).coverUrl).toBe('');
  });

  it('derives chaptersCount from the chapters array, null when absent (list items)', () => {
    expect(normalizeManga(ENV, SOURCE_ID.DESUME, raw({ chapters: null })).chaptersCount).toBeNull();
    expect(
      normalizeManga(ENV, SOURCE_ID.DESUME, raw({ chapters: [chapter(), chapter()] }))
        .chaptersCount,
    ).toBe(2);
  });
});

describe('normalizeChapter', () => {
  it('maps 0 (unknown sentinel) to null for number/volume, keeps positive values', () => {
    const c = normalizeChapter(SOURCE_ID.DESUME, 'manga-id', chapter({ number: 0, volume: 0 }));
    expect(c.number).toBeNull();
    expect(c.volume).toBeNull();

    const c2 = normalizeChapter(SOURCE_ID.DESUME, 'manga-id', chapter({ number: 12.5, volume: 3 }));
    expect(c2.number).toBe(12.5);
    expect(c2.volume).toBe(3);
  });

  it('maps 0 uploadDate to null, otherwise formats as YYYY-MM-DDTHH:MM:SSZ from epoch millis', () => {
    expect(
      normalizeChapter(SOURCE_ID.DESUME, 'm', chapter({ uploadDate: 0 })).uploadedAt,
    ).toBeNull();
    const ms = Date.UTC(2024, 0, 15, 12, 0, 0);
    expect(normalizeChapter(SOURCE_ID.DESUME, 'm', chapter({ uploadDate: ms })).uploadedAt).toBe(
      '2024-01-15T12:00:00Z',
    );
  });
});

describe('normalizeFilterGroup', () => {
  it('passes id/title/type/options through unchanged — no case or key transforms', () => {
    const raw: RawFilterGroup = {
      id: 'genre',
      title: 'Жанры',
      type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
      options: [{ key: '12-action', title: 'Боевик', count: 130 }],
    };
    expect(normalizeFilterGroup(raw)).toEqual({
      id: 'genre',
      title: 'Жанры',
      type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
      options: [{ key: '12-action', title: 'Боевик', count: 130 }],
    });
  });

  it('passes settings through for RANGE groups', () => {
    const raw: RawFilterGroup = {
      id: 'year',
      title: 'Год выпуска',
      type: FILTER_TYPE.RANGE,
      options: [],
      settings: { range: { min: 1950, max: 2026 } },
    };
    expect(normalizeFilterGroup(raw)).toEqual({
      id: 'year',
      title: 'Год выпуска',
      type: FILTER_TYPE.RANGE,
      options: [],
      settings: { range: { min: 1950, max: 2026 } },
    });
  });
});

describe('branch grouping', () => {
  it('picks the branch with the most chapters as default, ties broken by freshness', () => {
    const chapters = [
      chapter({ id: 1, branch: 'A', uploadDate: 1000 }),
      chapter({ id: 2, branch: 'A', uploadDate: 2000 }),
      chapter({ id: 3, branch: 'B', uploadDate: 5000 }),
    ];
    // Branch A has 2 chapters vs B's 1 — A wins on count even though B is fresher.
    expect(pickDefaultBranch(chapters)).toBe('A');
  });

  it('computeBranches reports chaptersCount and lastUpdatedAt per branch', () => {
    const chapters = [
      chapter({ id: 1, branch: null, uploadDate: 1000 }),
      chapter({ id: 2, branch: null, uploadDate: 3000 }),
    ];
    const branches = computeBranches(chapters);
    expect(branches).toHaveLength(1);
    expect(branches[0]!.id).toBe('default');
    expect(branches[0]!.chaptersCount).toBe(2);
    expect(branches[0]!.lastUpdatedAt).toBe('1970-01-01T00:00:03Z');
  });
});
