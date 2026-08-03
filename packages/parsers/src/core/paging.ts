import type { RawManga } from '../types';

export interface ListParams {
  /** Offset in API items, always a multiple of `limit` (page * limit). */
  offset: number;
  /** Always 20 today (apps/api's PAGE_SIZE), explicit so the math below isn't hardcoded. */
  limit: number;
  order?: string;
  query?: string;
}

export interface PagingWindow {
  pages: number[];
  skip: number;
}

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
export function planWindow(
  offset: number,
  limit: number,
  size: number,
  firstPage = 1,
): PagingWindow {
  const firstIndex = Math.floor(offset / size);
  const lastIndex = Math.floor((offset + limit - 1) / size);
  const pages: number[] = [];
  for (let i = firstIndex; i <= lastIndex; i += 1) {
    pages.push(i + firstPage);
  }
  return { pages, skip: offset - firstIndex * size };
}

/** For sources whose catalog is paginated by an opaque page number (most sources). */
export async function fetchPaged(
  params: ListParams,
  cfg: { size: number; firstPage: number },
  fetchPage: (page: number) => Promise<RawManga[]>,
): Promise<RawManga[]> {
  const { pages, skip } = planWindow(params.offset, params.limit, cfg.size, cfg.firstPage);
  const acc: RawManga[] = [];
  for (const page of pages) {
    const items = await fetchPage(page);
    acc.push(...items);
    if (items.length < cfg.size) break; // short page = end of catalog
  }
  return acc.slice(skip, skip + params.limit);
}

/** For offset-native sources (Grouple, Chan, NudeMoon) whose list endpoint takes a raw offset. */
export async function fetchOffsetNative(
  params: ListParams,
  cfg: { size: number },
  fetchOffset: (nativeOffset: number) => Promise<RawManga[]>,
): Promise<RawManga[]> {
  const base = Math.floor(params.offset / cfg.size) * cfg.size;
  const acc: RawManga[] = [];
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
}
