import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { isReaderInteractionBlocked } from '../navigation';
import type { Bounds, Pinch, Point, View } from './models';

const GESTURE = {
  SCREEN_EDGE_WIDTH: 24,
  SWIPE_DISTANCE: 50,
  TAP_DISTANCE: 12,
  DOUBLE_TAP_MS: 260,
  DOUBLE_TAP_SCALE: 2,
  MAX_SCALE: 4,
} as const;

type Params = {
  horizontal: boolean;
  positionKey: string;
  onLeft: () => void;
  onRight: () => void;
  onTap: () => void;
  onZoomChange: (zoomed: boolean) => void;
  tapZoneWidth: number;
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function useReaderGestures({
  horizontal,
  positionKey,
  onLeft,
  onRight,
  onTap,
  onZoomChange,
  tapZoneWidth,
}: Params) {
  const [zoomed, setZoomed] = useState(false);
  const currentView = useRef<View>({ scale: 1, x: 0, y: 0 });
  const zoomState = useRef(false);
  const frame = useRef<number | null>(null);
  const contentElement = useRef<HTMLDivElement>(null);
  const contentRef = useCallback((element: HTMLDivElement | null) => {
    contentElement.current = element;
    if (!contentElement.current) return;
    const current = currentView.current;
    contentElement.current.style.transform = `translate(${current.x}px, ${current.y}px) scale(${current.scale})`;
  }, []);
  const bounds = useRef<Bounds | null>(null);
  const [renderedKey, setRenderedKey] = useState(positionKey);
  if (renderedKey !== positionKey) {
    setRenderedKey(positionKey);
    setZoomed(false);
  }
  const pointers = useRef(new Map<number, Point>());
  const start = useRef<Point | null>(null);
  const pinch = useRef<Pinch | null>(null);
  const pan = useRef<Point>({ x: 0, y: 0 });
  const moved = useRef(false);
  const wasPinch = useRef(false);
  const lastTap = useRef<{ point: Point; time: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncZoomState = (active: boolean) => {
    if (zoomState.current === active) return;
    zoomState.current = active;
    setZoomed(active);
    onZoomChange(active);
  };

  const updateView = (next: View) => {
    currentView.current = next;
    // Keep observation paused until a pinch ends, even when it briefly returns to ×1.
    syncZoomState(next.scale > 1 || pointers.current.size > 1);
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const current = currentView.current;
      if (contentElement.current)
        contentElement.current.style.transform = `translate(${current.x}px, ${current.y}px) scale(${current.scale})`;
    });
  };

  // React delegates touch listeners passively. A native listener prevents a two-finger pan
  // from becoming document scrolling midway through a pinch that started with pan-y.
  const viewportRef = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1 || currentView.current.scale > 1) event.preventDefault();
    };
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => element.removeEventListener('touchmove', onTouchMove);
  }, []);

  useLayoutEffect(() => {
    const activePointers = pointers.current;
    const reset = () => {
      activePointers.clear();
      pinch.current = null;
      start.current = null;
      bounds.current = null;
      if (timer.current) clearTimeout(timer.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      lastTap.current = null;
      currentView.current = { scale: 1, x: 0, y: 0 };
      if (contentElement.current)
        contentElement.current.style.transform = 'translate(0px, 0px) scale(1)';
      zoomState.current = false;
      onZoomChange(false);
    };
    reset();
    const onResize = () => {
      reset();
      setZoomed(false);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (timer.current) clearTimeout(timer.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      activePointers.clear();
      lastTap.current = null;
    };
  }, [positionKey, onZoomChange]);

  const measureBounds = () => {
    const content = contentElement.current;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    const transform = new DOMMatrix(getComputedStyle(content).transform);
    bounds.current = {
      x: rect.left - transform.e,
      y: rect.top - transform.f,
      width: content.clientWidth,
      height: content.clientHeight,
    };
  };

  const constrainView = (next: View): View => {
    const rect = bounds.current;
    if (next.scale === 1) return { scale: 1, x: 0, y: 0 };
    if (!rect) return next;
    const minX = window.innerWidth - rect.x - rect.width * next.scale;
    const minY = window.innerHeight - rect.y - rect.height * next.scale;
    return {
      scale: next.scale,
      x: Math.max(Math.min(minX, -rect.x), Math.min(-rect.x, next.x)),
      y: Math.max(Math.min(minY, -rect.y), Math.min(-rect.y, next.y)),
    };
  };

  // Keep the content coordinate under the fingers at their moving midpoint.
  const zoomAt = (initial: View, anchor: Point, point: Point, scale: number) => {
    const origin = bounds.current ?? { x: 0, y: 0 };
    const ratio = scale / initial.scale;
    return constrainView({
      scale,
      x: point.x - origin.x - (anchor.x - origin.x - initial.x) * ratio,
      y: point.y - origin.y - (anchor.y - origin.y - initial.y) * ratio,
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || isReaderInteractionBlocked(event.nativeEvent)) return;
    const point = { x: event.clientX, y: event.clientY };
    if (pointers.current.size === 0) measureBounds();
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 1) {
      start.current = point;
      pan.current = currentView.current;
      moved.current = false;
      wasPinch.current = false;
    } else if (pointers.current.size === 2) {
      if (timer.current) clearTimeout(timer.current);
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      lastTap.current = null;
      wasPinch.current = true;
      pinch.current = {
        distance: distance(a, b),
        center: center(a, b),
        view: currentView.current,
      };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (start.current && distance(start.current, point) > GESTURE.TAP_DISTANCE)
      moved.current = true;
    const [a, b] = [...pointers.current.values()];
    if (a && b && pinch.current) {
      const initial = pinch.current;
      const midpoint = center(a, b);
      const scale = Math.min(
        GESTURE.MAX_SCALE,
        Math.max(1, (initial.view.scale * distance(a, b)) / Math.max(1, initial.distance)),
      );
      updateView(zoomAt(initial.view, initial.center, midpoint, scale));
    } else if (currentView.current.scale > 1 && start.current) {
      updateView(
        constrainView({
          scale: currentView.current.scale,
          x: pan.current.x + point.x - start.current.x,
          y: pan.current.y + point.y - start.current.y,
        }),
      );
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) syncZoomState(currentView.current.scale > 1);
    if (pointers.current.size === 1 && wasPinch.current) {
      start.current = [...pointers.current.values()][0] ?? null;
      pan.current = currentView.current;
      pinch.current = null;
      return;
    }
    if (pointers.current.size > 0 || wasPinch.current || !start.current) return;
    const point = { x: event.clientX, y: event.clientY };
    const deltaX = point.x - start.current.x;
    const deltaY = point.y - start.current.y;
    if (moved.current) {
      // Горизонтальный свайп внутрь экрана от самого края принадлежит браузеру.
      const startsAtScreenEdge =
        event.pointerType === 'touch' &&
        (deltaX > 0
          ? start.current.x <= GESTURE.SCREEN_EDGE_WIDTH
          : start.current.x >= window.innerWidth - GESTURE.SCREEN_EDGE_WIDTH);
      if (
        !startsAtScreenEdge &&
        currentView.current.scale === 1 &&
        horizontal &&
        Math.abs(deltaX) >= GESTURE.SWIPE_DISTANCE &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.2
      ) {
        if (deltaX > 0) onLeft();
        else onRight();
      }
      return;
    }
    if (
      lastTap.current &&
      Date.now() - lastTap.current.time <= GESTURE.DOUBLE_TAP_MS &&
      distance(lastTap.current.point, point) < 40
    ) {
      if (timer.current) clearTimeout(timer.current);
      lastTap.current = null;
      measureBounds();
      updateView(
        zoomAt(
          currentView.current,
          point,
          point,
          currentView.current.scale > 1 ? 1 : GESTURE.DOUBLE_TAP_SCALE,
        ),
      );
      return;
    }
    lastTap.current = { point, time: Date.now() };
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = (point.x - left) / width;
    timer.current = setTimeout(() => {
      lastTap.current = null;
      if (currentView.current.scale > 1) return;
      if (!horizontal) onTap();
      else if (ratio < tapZoneWidth / 100) onLeft();
      else if (ratio > 1 - tapZoneWidth / 100) onRight();
      else onTap();
    }, GESTURE.DOUBLE_TAP_MS);
  };

  const onPointerCancel = () => {
    pointers.current.clear();
    syncZoomState(currentView.current.scale > 1);
    start.current = null;
    pinch.current = null;
    if (timer.current) clearTimeout(timer.current);
    lastTap.current = null;
  };

  return {
    contentRef,
    viewportRef,
    bindings: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: (event: ReactPointerEvent<HTMLElement>) => {
        if (pointers.current.has(event.pointerId)) onPointerCancel();
      },
    },
    // Keep tall pages scrollable at their normal scale; horizontal swipes stay app-owned.
    touchAction: zoomed ? 'none' : 'pan-y',
  };
}

export default useReaderGestures;
