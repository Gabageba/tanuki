import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { isReaderInteractionBlocked } from '../navigation';

const GESTURE = {
  SWIPE_DISTANCE: 50,
  TAP_DISTANCE: 12,
  DOUBLE_TAP_MS: 260,
  DOUBLE_TAP_SCALE: 2,
  MAX_SCALE: 4,
} as const;

type Point = { x: number; y: number };
type Params = {
  horizontal: boolean;
  positionKey: string;
  onLeft: () => void;
  onRight: () => void;
  onTap: () => void;
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
  tapZoneWidth,
}: Params) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [renderedKey, setRenderedKey] = useState(positionKey);
  if (renderedKey !== positionKey) {
    setRenderedKey(positionKey);
    setView({ scale: 1, x: 0, y: 0 });
  }
  const pointers = useRef(new Map<number, Point>());
  const start = useRef<Point | null>(null);
  const pinch = useRef<{
    distance: number;
    center: Point;
    scale: number;
    x: number;
    y: number;
  } | null>(null);
  const pan = useRef<Point>({ x: 0, y: 0 });
  const moved = useRef(false);
  const wasPinch = useRef(false);
  const lastTap = useRef<{ point: Point; time: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      pointers.current.clear();
      pinch.current = null;
      start.current = null;
      setView({ scale: 1, x: 0, y: 0 });
    };
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      pointers.current.clear();
      lastTap.current = null;
    },
    [positionKey],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || isReaderInteractionBlocked(event.nativeEvent)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 1) {
      start.current = point;
      pan.current = { x: view.x, y: view.y };
      moved.current = false;
      wasPinch.current = false;
    } else if (pointers.current.size === 2) {
      if (timer.current) clearTimeout(timer.current);
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      wasPinch.current = true;
      pinch.current = {
        distance: distance(a, b),
        center: center(a, b),
        scale: view.scale,
        x: view.x,
        y: view.y,
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
        Math.max(1, (initial.scale * distance(a, b)) / Math.max(1, initial.distance)),
      );
      setView({
        scale,
        x: scale === 1 ? 0 : initial.x + midpoint.x - initial.center.x,
        y: scale === 1 ? 0 : initial.y + midpoint.y - initial.center.y,
      });
    } else if (view.scale > 1 && start.current && !wasPinch.current) {
      const limitX = (event.currentTarget.clientWidth * (view.scale - 1)) / 2;
      const limitY = (window.innerHeight * (view.scale - 1)) / 2;
      setView({
        scale: view.scale,
        x: Math.max(-limitX, Math.min(limitX, pan.current.x + point.x - start.current.x)),
        y: Math.max(-limitY, Math.min(limitY, pan.current.y + point.y - start.current.y)),
      });
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0 || wasPinch.current || !start.current) return;
    const point = { x: event.clientX, y: event.clientY };
    const deltaX = point.x - start.current.x;
    const deltaY = point.y - start.current.y;
    if (moved.current) {
      if (
        view.scale === 1 &&
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
      setView({ scale: view.scale > 1 ? 1 : GESTURE.DOUBLE_TAP_SCALE, x: 0, y: 0 });
      return;
    }
    lastTap.current = { point, time: Date.now() };
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = (point.x - left) / width;
    timer.current = setTimeout(() => {
      lastTap.current = null;
      if (view.scale > 1) return;
      if (!horizontal) onTap();
      else if (ratio < tapZoneWidth / 100) onLeft();
      else if (ratio > 1 - tapZoneWidth / 100) onRight();
      else onTap();
    }, GESTURE.DOUBLE_TAP_MS);
  };

  const onPointerCancel = () => {
    pointers.current.clear();
    start.current = null;
    pinch.current = null;
    if (timer.current) clearTimeout(timer.current);
  };

  return {
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
    touchAction: view.scale > 1 ? 'none' : 'pan-y',
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    zoomed: view.scale > 1,
  };
}

export default useReaderGestures;
