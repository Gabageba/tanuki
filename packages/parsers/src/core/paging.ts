import type { FilterSelection } from '@tanuki/contracts';
import type { RawTitle } from '../types';

export type { FilterSelection };

export type ListParams = {
  /** Offset in API items, always a multiple of `limit` (page * limit). */
  offset: number;
  /** Always 20 today (apps/api's PAGE_SIZE), explicit so the math below isn't hardcoded. */
  limit: number;
  order?: string;
  direction?: string;
  query?: string;
  /** Selections from a getFilters() group — sources without getFilters just ignore this. */
  filters?: FilterSelection[];
};

export type PagingWindow = {
  pages: number[];
  skip: number;
};

/**
 * offset/limit in API items -> the native pages that cover [offset, offset+limit).
 *
 * The Kotlin sidecar got this wrong: `Routes.kt` calls `newParserInstance` on every HTTP
 * request, so the memoization table inside kotatsu's `Paginator.getPage()` is always empty,
 * and every call falls through to `intPage + firstPage + (tail == 0 ? 0 : 1)`. For a source
 * with pageSize 24 at API offset 20: intPage=0, tail=20 -> native page 2 -> items 24..47,
 * silently dropping items 20..23. This implementation is stateless and correct instead of
 * reproducing that gap.
 */
export const planWindow = (
  offset: number,
  limit: number,
  size: number,
  firstPage = 1,
): PagingWindow => {
  const firstIndex = Math.floor(offset / size);
  const lastIndex = Math.floor((offset + limit - 1) / size);
  const pages: number[] = [];
  for (let i = firstIndex; i <= lastIndex; i += 1) {
    pages.push(i + firstPage);
  }
  return { pages, skip: offset - firstIndex * size };
};

/** For sources whose catalog is paginated by an opaque page number (most sources). */
export const fetchPaged = async (
  params: ListParams,
  cfg: { size: number; firstPage: number },
  fetchPage: (page: number) => Promise<RawTitle[]>,
): Promise<RawTitle[]> => {
  const { pages, skip } = planWindow(params.offset, params.limit, cfg.size, cfg.firstPage);
  const acc: RawTitle[] = [];
  for (const page of pages) {
    const items = await fetchPage(page);
    acc.push(...items);
    if (items.length < cfg.size) break; // short page = end of catalog
  }
  return acc.slice(skip, skip + params.limit);
};

/** For offset-native sources (Grouple, Chan, NudeMoon) whose list endpoint takes a raw offset. */
export const fetchOffsetNative = async (
  params: ListParams,
  cfg: { size: number },
  fetchOffset: (nativeOffset: number) => Promise<RawTitle[]>,
): Promise<RawTitle[]> => {
  const base = Math.floor(params.offset / cfg.size) * cfg.size;
  const acc: RawTitle[] = [];
  for (
    let nativeOffset = base;
    nativeOffset < params.offset + params.limit;
    nativeOffset += cfg.size
  ) {
    const items = await fetchOffset(nativeOffset);
    acc.push(...items);
    if (items.length < cfg.size) break;
  }
  return acc.slice(params.offset - base, params.offset - base + params.limit);
};

/**
 * For cursor-native sources (Senkuro) whose list endpoint only exposes an opaque forward
 * cursor — no direct "give me page N" or "skip N items". Reaching offset K therefore costs
 * ceil(K / cfg.maxPageSize) requests, since each response's cursor is required to ask for the
 * next chunk. cfg.maxPageSize should be the endpoint's max items-per-request; requesting exactly
 * `target - acc.length` (capped at that max) means offsets that fit in one page cost one request.
 */
export const fetchCursorPaged = async (
  params: ListParams,
  cfg: { maxPageSize: number },
  fetchPage: (
    cursor: string | null,
    first: number,
  ) => Promise<{ items: RawTitle[]; nextCursor: string | null }>,
): Promise<RawTitle[]> => {
  const target = params.offset + params.limit;
  const acc: RawTitle[] = [];
  let cursor: string | null = null;
  while (acc.length < target) {
    const first = Math.min(cfg.maxPageSize, target - acc.length);
    const { items, nextCursor } = await fetchPage(cursor, first);
    acc.push(...items);
    if (items.length < first || !nextCursor) break;
    cursor = nextCursor;
  }
  return acc.slice(params.offset, params.offset + params.limit);
};
