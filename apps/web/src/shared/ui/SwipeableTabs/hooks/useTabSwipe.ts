import { useEffect, useRef } from 'react';
import {
  ROOT_SELECTOR,
  IGNORED_SELECTOR,
  EDGE_DISTANCE,
  DIRECTION_DISTANCE,
  SWIPE_DISTANCE,
  HORIZONTAL_RATIO,
  type TabSwipeGesture,
} from '../models';

function useTabSwipe(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return;

    const getTabs = () =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
        (tab) =>
          tab.closest(ROOT_SELECTOR) === root &&
          !tab.disabled &&
          tab.getAttribute('aria-disabled') !== 'true' &&
          tab.getClientRects().length > 0,
      );

    // Вложенная горизонтальная прокрутка целиком владеет жестом, даже на своих краях.
    const isScrollable = (target: Element) => {
      for (let element: Element | null = target; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        if (
          style.touchAction === 'none' ||
          (element.scrollWidth > element.clientWidth &&
            ['auto', 'scroll'].includes(style.overflowX))
        ) {
          return true;
        }
        if (element === root) break;
      }
      return false;
    };

    let gesture: TabSwipeGesture | null = null;

    const cancel = () => {
      gesture = null;
    };

    const start = (event: TouchEvent) => {
      cancel();
      const touch = event.touches[0];
      const target = event.target;
      if (
        event.defaultPrevented ||
        event.touches.length !== 1 ||
        !touch ||
        !(target instanceof Element) ||
        target.closest(ROOT_SELECTOR) !== root ||
        target.closest(IGNORED_SELECTOR) ||
        isScrollable(target) ||
        touch.clientX < EDGE_DISTANCE ||
        touch.clientX > window.innerWidth - EDGE_DISTANCE
      ) {
        return;
      }
      const tabs = getTabs();
      const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
      if (tabs.length < 2 || !activeTab) return;
      gesture = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        horizontal: false,
        activeTab,
      };
    };

    const move = (event: TouchEvent) => {
      if (!gesture) return;
      const touch = event.touches[0];
      if (event.touches.length !== 1 || !touch || touch.identifier !== gesture.id) {
        cancel();
        return;
      }
      const dx = Math.abs(touch.clientX - gesture.x);
      const dy = Math.abs(touch.clientY - gesture.y);
      if (!gesture.horizontal) {
        if (Math.max(dx, dy) < DIRECTION_DISTANCE) return;
        if (dx < dy * HORIZONTAL_RATIO || event.defaultPrevented) {
          cancel();
          return;
        }
        gesture.horizontal = true;
      }
      // Нативный non-passive listener сохраняет вертикальный скролл и масштабирование,
      // но после распознавания свайпа предотвращает прокрутку и клик по ссылке под пальцем.
      if (!event.cancelable) {
        cancel();
        return;
      }
      event.preventDefault();
    };

    const end = (event: TouchEvent) => {
      const current = gesture;
      cancel();
      if (!current?.horizontal || event.touches.length > 0) return;
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === current.id);
      if (!touch || current.activeTab.getAttribute('aria-selected') !== 'true') return;
      const dx = touch.clientX - current.x;
      if (
        Math.abs(dx) < SWIPE_DISTANCE ||
        Math.abs(dx) < Math.abs(touch.clientY - current.y) * HORIZONTAL_RATIO
      ) {
        return;
      }
      const tabs = getTabs();
      const index = tabs.indexOf(current.activeTab);
      if (index < 0) return;
      const next = tabs[index + (dx < 0 ? 1 : -1)];
      // Клик сохраняет штатный onChange, URL и неконтролируемое состояние Mantine.
      next?.click();
      // Показываем активную вкладку в её полосе, не прокручивая саму страницу по вертикали.
      if (!next) return;
      for (
        let element = next.parentElement;
        element && element !== root;
        element = element.parentElement
      ) {
        if (
          element.scrollWidth <= element.clientWidth ||
          !['auto', 'scroll'].includes(getComputedStyle(element).overflowX)
        ) {
          continue;
        }
        const tabRect = next.getBoundingClientRect();
        const scrollRect = element.getBoundingClientRect();
        const offset =
          Math.min(0, tabRect.left - scrollRect.left) +
          Math.max(0, tabRect.right - scrollRect.right);
        element.scrollBy({ left: offset });
      }
    };

    root.addEventListener('touchstart', start, { passive: true });
    root.addEventListener('touchmove', move, { passive: false });
    root.addEventListener('touchend', end, { passive: true });
    root.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      root.removeEventListener('touchstart', start);
      root.removeEventListener('touchmove', move);
      root.removeEventListener('touchend', end);
      root.removeEventListener('touchcancel', cancel);
    };
  }, [enabled]);

  return ref;
}

export default useTabSwipe;
