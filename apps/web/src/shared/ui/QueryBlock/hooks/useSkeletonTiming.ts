import { useEffect, useRef, useState } from 'react';
import { getQueryLoad, scrollBlockIntoView } from '../lib';
import { SKELETON_DELAY_MS, SKELETON_MIN_MS, type LoadingQuery } from '../models';

/**
 * Когда показывать скелетон вместо содержимого блока:
 * - данных нет — сразу;
 * - устаревшие данные из кэша при монтировании — сразу, устаревшее не показывается ни на миг;
 * - данные на экране, а идёт запрос за новыми (смена параметров, фокус вкладки, инвалидация) —
 *   через `SKELETON_DELAY_MS`, и держится он не меньше `SKELETON_MIN_MS`; верх блока, если ушёл
 *   под шапку, поднимается в видимую область.
 * `ref` — на корень блока, к нему прокручивается.
 */
function useSkeletonTiming<TElement extends HTMLElement>(query: LoadingQuery) {
  const { isOffline, isFailed, isEmptyWait, isStaleWait } = getQueryLoad(query);
  const isWaiting = isEmptyWait || isStaleWait;
  const ref = useRef<TElement>(null);
  // Устаревшие данные при монтировании: скелетон сразу, без задержки и без прокрутки.
  const [isMountWait, setIsMountWait] = useState(isStaleWait);
  // Когда появился скелетон после задержки; null — не показан.
  const [delayedSince, setDelayedSince] = useState<number | null>(null);

  if (isMountWait && !isWaiting) {
    setIsMountWait(false);
  }

  useEffect(() => {
    if (isWaiting) {
      if (!isStaleWait || isMountWait || delayedSince !== null) return;
      const timer = setTimeout(() => setDelayedSince(Date.now()), SKELETON_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (delayedSince === null) return;
    const left = Math.max(0, delayedSince + SKELETON_MIN_MS - Date.now());
    const timer = setTimeout(() => setDelayedSince(null), left);
    return () => clearTimeout(timer);
  }, [isWaiting, isStaleWait, isMountWait, delayedSince]);

  useEffect(() => {
    if (delayedSince !== null) {
      scrollBlockIntoView(ref.current);
    }
  }, [delayedSince]);

  return {
    ref,
    isSkeleton: isEmptyWait || (isStaleWait && isMountWait) || delayedSince !== null,
    isOffline,
    isFailed,
  };
}

export default useSkeletonTiming;
