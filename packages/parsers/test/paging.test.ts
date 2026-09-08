import { describe, expect, it, vi } from 'vitest';
import { planWindow, fetchPaged, fetchOffsetNative } from '../src/core/paging';
import type { RawManga } from '../src/types';

const manga = (id: number): RawManga => {
  return {
    id,
    title: `Manga ${id}`,
    altTitles: [],
    url: `/manga/${id}`,
    publicUrl: `https://example.com/manga/${id}`,
    rating: -1,
    contentRating: null,
    coverUrl: null,
    tags: [],
    releaseState: null,
    authors: [],
    largeCoverUrl: null,
    description: null,
    chapters: null,
    source: 'TEST',
  };
};

describe('planWindow', () => {
  // Table mirrors the real per-source native page sizes from the fork, verified in
  // docs/03-parsers.md's migration plan — this is the exact bug the Kotlin sidecar had
  // (Routes.kt instantiates a fresh parser per request, so kotatsu's Paginator memo table is
  // always empty and every offset falls through to an off-by-one-page arithmetic branch).
  it.each([
    { size: 24, firstPage: 1, offset: 0, limit: 20, pages: [1], skip: 0 },
    { size: 24, firstPage: 1, offset: 20, limit: 20, pages: [1, 2], skip: 20 },
    { size: 10, firstPage: 1, offset: 20, limit: 20, pages: [3, 4], skip: 0 },
    { size: 60, firstPage: 1, offset: 20, limit: 20, pages: [1], skip: 20 },
    { size: 30, firstPage: 0, offset: 20, limit: 20, pages: [0, 1], skip: 20 },
    { size: 20, firstPage: 1, offset: 40, limit: 20, pages: [3], skip: 0 },
  ])('size=$size firstPage=$firstPage offset=$offset -> pages=$pages skip=$skip', (t) => {
    const window = planWindow(t.offset, t.limit, t.size, t.firstPage);
    expect(window.pages).toEqual(t.pages);
    expect(window.skip).toBe(t.skip);
  });
});

describe('fetchPaged', () => {
  it('does not drop items at a page boundary (the sidecar pagination bug)', async () => {
    // 24-item native pages (Desu). Page 1 = items 0..23, page 2 = items 24..47.
    const fetchPage = vi.fn(async (page: number) => {
      const start = (page - 1) * 24;
      return Array.from({ length: 24 }, (_, i) => manga(start + i));
    });
    const page0 = await fetchPaged({ offset: 0, limit: 20 }, { size: 24, firstPage: 1 }, fetchPage);
    const page1 = await fetchPaged(
      { offset: 20, limit: 20 },
      { size: 24, firstPage: 1 },
      fetchPage,
    );

    expect(page0.map((m) => m.id)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ]);
    // Items 20..23 must appear — this is exactly what the sidecar's stateless Paginator dropped.
    expect(page1.map((m) => m.id)).toEqual([
      20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    ]);
  });

  it('stops fetching once a short page signals end of catalog', async () => {
    const fetchPage = vi.fn(async (page: number) =>
      page === 1 ? [manga(1), manga(2)] : [manga(99)],
    );
    const result = await fetchPaged(
      { offset: 0, limit: 20 },
      { size: 24, firstPage: 1 },
      fetchPage,
    );
    expect(result).toHaveLength(2);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});

describe('fetchOffsetNative', () => {
  it('covers the requested window for an offset-native source (Grouple, size 50)', async () => {
    const fetchOffset = vi.fn(async (offset: number) =>
      Array.from({ length: 50 }, (_, i) => manga(offset + i)),
    );
    const result = await fetchOffsetNative({ offset: 20, limit: 20 }, { size: 50 }, fetchOffset);
    expect(result.map((m) => m.id)).toEqual(Array.from({ length: 20 }, (_, i) => 20 + i));
    expect(fetchOffset).toHaveBeenCalledWith(0);
  });

  it('stops fetching once a short response signals end of catalog', async () => {
    const fetchOffset = vi.fn(async (offset: number) => (offset === 0 ? [manga(1)] : [manga(2)]));
    const result = await fetchOffsetNative({ offset: 0, limit: 20 }, { size: 50 }, fetchOffset);
    expect(result).toHaveLength(1);
    expect(fetchOffset).toHaveBeenCalledTimes(1);
  });
});
