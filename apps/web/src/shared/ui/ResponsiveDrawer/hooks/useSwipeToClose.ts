import { useEffect, useRef, type PointerEvent } from 'react';
import { SWIPE_CLOSE_DISTANCE } from '../models';

type Options = {
  opened: boolean;
  isEnabled: boolean;
  onClose: () => void;
};

/** Свайп вниз за шапку drawer снизу: панель едет за пальцем и закрывается, если протянуть её
 *  дальше `SWIPE_CLOSE_DISTANCE`, иначе возвращается на место. */
function useSwipeToClose({ opened, isEnabled, onClose }: Options) {
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const offset = useRef(0);

  const setOffset = (value: number) => {
    offset.current = value;
    contentRef.current?.style.setProperty('--sheet-offset', `${value}px`);
  };

  // Закрытый свайпом drawer уезжает со сдвигом, открываться он должен с нуля.
  useEffect(() => {
    if (!opened) return;
    offset.current = 0;
    contentRef.current?.style.removeProperty('--sheet-offset');
  }, [opened]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    // С кнопки в шапке (крестик, «назад») жест не начинается: захват указателя отнял бы у неё
    // клик.
    if (!isEnabled || event.button !== 0 || (event.target as HTMLElement).closest('button')) {
      return;
    }
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    contentRef.current?.setAttribute('data-dragging', '');
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (startY.current === null) return;
    setOffset(Math.max(0, event.clientY - startY.current));
  };

  const onPointerEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    contentRef.current?.removeAttribute('data-dragging');
    if (offset.current > SWIPE_CLOSE_DISTANCE) {
      onClose();
    } else {
      setOffset(0);
    }
  };

  return [
    contentRef,
    {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  ] as const;
}

export default useSwipeToClose;
