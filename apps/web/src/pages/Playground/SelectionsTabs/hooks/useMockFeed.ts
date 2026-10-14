import { useEffect, useRef, useState } from 'react';
import type { Source } from '@tanuki/contracts';
import { makeBlockPage } from '../mocks';
import {
  FEED_STATE,
  MOCK_DELAY_MS,
  type FeedState,
  type MockBlock,
  type MockFeed,
} from '../models';

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

type Options = {
  /** Период и что внутри блока — другие тайтлы при смене. */
  salt?: string;
  /** Итог: следующая порция один раз падает, «Повторить» её догружает. */
  failNextPageOnce?: boolean;
};

/** Застывшее состояние блока: сколько порций уже пришло и что сейчас происходит внизу. */
const getStaticFeed = (
  source: Source,
  block: MockBlock,
  state: FeedState,
  salt: string,
): MockFeed => {
  const pagesOf = (count: number) =>
    range(count).flatMap((page) => makeBlockPage(source, block, page, salt));
  const base = { isLoading: false, isFetchingNextPage: false, isNextPageFailed: false };
  switch (state) {
    case FEED_STATE.LOADING:
      return { ...base, items: [], hasNextPage: false, isLoading: true };
    case FEED_STATE.EMPTY:
      return { ...base, items: [], hasNextPage: false };
    case FEED_STATE.LOADING_MORE:
      return { ...base, items: pagesOf(1), hasNextPage: true, isFetchingNextPage: true };
    case FEED_STATE.NEXT_PAGE_ERROR:
      return { ...base, items: pagesOf(1), hasNextPage: true, isNextPageFailed: true };
    case FEED_STATE.END:
    case FEED_STATE.LIVE:
      return { ...base, items: pagesOf(block.pages), hasNextPage: false };
  }
};

/**
 * Блок, который отвечает порциями, как будущий `GET /selections/:sourceId/:sectionId?page=`.
 * `live` — первая порция приходит с задержкой, следующие — по `fetchNextPage`; остальные состояния
 * застывшие, для показа рядом. Компонент с хуком перемонтируется по ключу блока.
 */
function useMockFeed(
  source: Source,
  block: MockBlock,
  state: FeedState,
  { salt = '', failNextPageOnce = false }: Options = {},
) {
  const isLive = state === FEED_STATE.LIVE;
  const [loaded, setLoaded] = useState(0);
  const [isFetching, setIsFetching] = useState(isLive);
  const [isFailed, setIsFailed] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isLive) return;
    timer.current = window.setTimeout(() => {
      setLoaded(1);
      setIsFetching(false);
    }, MOCK_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [isLive]);

  const fetchNextPage = () => {
    if (!isLive || isFetching || loaded === 0 || loaded >= block.pages) return;
    setIsFetching(true);
    setIsFailed(false);
    const shouldFail = failNextPageOnce && !hasFailed;
    timer.current = window.setTimeout(() => {
      if (shouldFail) {
        setIsFailed(true);
        setHasFailed(true);
      } else {
        setLoaded((value) => value + 1);
      }
      setIsFetching(false);
    }, MOCK_DELAY_MS);
  };

  if (!isLive) {
    return { feed: getStaticFeed(source, block, state, salt), fetchNextPage };
  }

  const feed: MockFeed = {
    items: range(loaded).flatMap((page) => makeBlockPage(source, block, page, salt)),
    hasNextPage: loaded < block.pages,
    isLoading: loaded === 0,
    isFetchingNextPage: isFetching && loaded > 0,
    isNextPageFailed: isFailed,
  };
  return { feed, fetchNextPage };
}

export default useMockFeed;
