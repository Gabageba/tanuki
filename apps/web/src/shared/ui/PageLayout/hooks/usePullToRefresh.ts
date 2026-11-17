import { useEffect, useRef, useState } from 'react';
import { Toasts } from '@/shared/lib/toasts/store';

const PULL_THRESHOLD = 60;
const MAX_PULL = 120;
const RESISTANCE = 2;

function usePullToRefresh(onRefresh: (() => unknown) | undefined) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const enabled = onRefresh !== undefined;

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    const cancelPull = () => {
      startYRef.current = null;
      setPullDistance(0);
    };

    const isNestedScroll = (target: EventTarget | null) => {
      let element = target instanceof Element ? target : null;
      while (element && element !== document.body && element !== document.documentElement) {
        if (
          element.scrollHeight > element.clientHeight &&
          ['auto', 'scroll'].includes(getComputedStyle(element).overflowY)
        ) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target;
      if (
        event.touches.length !== 1 ||
        isNestedScroll(target) ||
        (target instanceof Element &&
          target.closest(
            '[role="dialog"], [role="listbox"], [role="menu"], input, textarea, select',
          ))
      ) {
        cancelPull();
        return;
      }
      if (touch && window.scrollY <= 0 && !isRefreshingRef.current) {
        startYRef.current = touch.clientY;
        startXRef.current = touch.clientX;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (startYRef.current === null || !touch) return;
      const delta = touch.clientY - startYRef.current;
      // Горизонтальный свайп вкладок и масштабирование не превращаются в обновление страницы.
      if (
        event.touches.length !== 1 ||
        window.scrollY > 0 ||
        Math.abs(touch.clientX - startXRef.current) > Math.abs(delta)
      ) {
        cancelPull();
        return;
      }
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      // Гасим нативный overscroll/pull-to-refresh браузера — иначе жест перехватывает браузер
      // и перезагружает страницу целиком в обход нашей логики отпускания.
      event.preventDefault();
      setPullDistance(Math.min(delta / RESISTANCE, MAX_PULL));
    };

    const refresh = async () => {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      Toasts.clearSuppression();
      try {
        await onRefreshRef.current?.();
      } catch {
        // Ошибку запроса уже показывает глобальный обработчик; жест лишь снимает индикатор.
      } finally {
        isRefreshingRef.current = false;
        if (!disposed) setIsRefreshing(false);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (startYRef.current === null) return;
      const touch = event.changedTouches[0];
      const delta = touch ? touch.clientY - startYRef.current : 0;
      cancelPull();

      const finalDistance = delta > 0 ? Math.min(delta / RESISTANCE, MAX_PULL) : 0;
      if (finalDistance >= PULL_THRESHOLD && !isRefreshingRef.current) {
        void refresh();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', cancelPull, { passive: true });

    return () => {
      disposed = true;
      startYRef.current = null;
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', cancelPull);
    };
  }, [enabled]);

  return { pullDistance, isRefreshing };
}

export default usePullToRefresh;
