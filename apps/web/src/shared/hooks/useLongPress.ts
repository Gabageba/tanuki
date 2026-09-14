import { useCallback, useRef } from 'react';

const LONG_PRESS_DELAY_MS = 500;

function useLongPress(onLongPress: () => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const start = useCallback(() => {
    timeoutRef.current = setTimeout(onLongPress, LONG_PRESS_DELAY_MS);
  }, [onLongPress]);

  const clear = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}

export default useLongPress;
