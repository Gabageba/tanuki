import { useEffect, useRef, useState } from 'react';
import { Toasts } from '@/shared/lib/toasts/store';

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
      // Гасим нативный overscroll/pull-to-refresh браузера — иначе жест перехватывает браузер
      // и перезагружает страницу целиком в обход нашей логики отпускания.
      event.preventDefault();
      setPullDistance(Math.min(delta / RESISTANCE, MAX_PULL));
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (startYRef.current === null) return;
      const touch = event.changedTouches[0];
      const delta = touch ? touch.clientY - startYRef.current : 0;
      startYRef.current = null;
      setPullDistance(0);

      const finalDistance = delta > 0 ? Math.min(delta / RESISTANCE, MAX_PULL) : 0;
      if (finalDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        Toasts.clearSuppression();
        onRefreshRef.current();
        setTimeout(() => setIsRefreshing(false), 500);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
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
