import { useEffect, useRef, useState } from 'react';

/** Сколько подсветка зон держится на экране после закрытия drawer'а. */
const TAP_ZONES_HINT_MS = 1600;

function useTapZonesHint() {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const show = () => {
    setIsVisible(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), TAP_ZONES_HINT_MS);
  };

  return { isVisible, show };
}

export default useTapZonesHint;
