import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 60;
const MAX_PULL = 120;
const RESISTANCE = 2;

function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch && window.scrollY === 0 && !isRefreshing) {
        startYRef.current = touch.clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (startYRef.current === null || !touch) return;
      const delta = touch.clientY - startYRef.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      setPullDistance(Math.min(delta / RESISTANCE, MAX_PULL));
    };

    const handleTouchEnd = () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      setPullDistance((distance) => {
        if (distance >= PULL_THRESHOLD) {
          setIsRefreshing(true);
          onRefreshRef.current();
          setTimeout(() => setIsRefreshing(false), 500);
        }
        return 0;
      });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);

  return { pullDistance, isRefreshing };
}

export default usePullToRefresh;
