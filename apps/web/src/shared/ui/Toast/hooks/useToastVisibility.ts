import { useLayoutEffect, useRef } from 'react';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_PAUSE } from '@/shared/lib/toasts/models';

/** На низком экране часть стека прокручивается: её время не должно сгорать за краем. */
function useToastVisibility(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) Toasts.pause(id, TOAST_PAUSE.CLIPPED, entry.intersectionRatio < 0.99);
      },
      { threshold: [0, 0.99, 1] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);
  return ref;
}

export default useToastVisibility;
