import { useCallback, useEffect, useRef } from 'react';
import {
  CURRENT_PAGE_ROOT_MARGIN,
  getReaderPageKey,
  getReaderPagePosition,
  scrollToReaderPage,
} from '../lib';
import type { ReaderPosition } from '../models';

type Params = {
  /** В горизонтальном режиме страница на экране ровно одна и выбирают её кликами — следить за
   *  скроллом там не за чем. */
  enabled: boolean;
  onChange: (position: ReaderPosition) => void;
};

/**
 * Текущая страница вертикальной ленты — та, что под центром экрана: rootMargin схлопывает область
 * наблюдения в линию, поэтому «пересекается» всегда ровно одна страница, а колбэк срабатывает
 * только в момент смены. Ни массива порогов, ни чтения геометрии на каждый кадр скролла.
 *
 * Заодно хук держит реестр отрисованных страниц — по нему же делается прокрутка к нужной странице
 * при смене режима и при переходе к уже загруженной главе.
 */
function useCurrentPageObserver({ enabled, onChange }: Params) {
  const elements = useRef(new Map<string, HTMLElement>());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const current = new IntersectionObserver(
      (entries) => {
        const centered = entries.find((entry) => entry.isIntersecting);
        if (!centered) return;

        const position = getReaderPagePosition(centered.target);
        if (position) onChange(position);
      },
      { rootMargin: CURRENT_PAGE_ROOT_MARGIN },
    );

    elements.current.forEach((element) => current.observe(element));
    observer.current = current;

    return () => {
      current.disconnect();
      observer.current = null;
    };
  }, [enabled, onChange]);

  const registerPage = useCallback((element: HTMLElement | null) => {
    const position = element && getReaderPagePosition(element);
    if (!element || !position) return;

    const key = getReaderPageKey(position);
    elements.current.set(key, element);
    observer.current?.observe(element);

    return () => {
      elements.current.delete(key);
      observer.current?.unobserve(element);
    };
  }, []);

  const scrollToPosition = useCallback((position: ReaderPosition) => {
    scrollToReaderPage(elements.current.get(getReaderPageKey(position)));
  }, []);

  return { registerPage, scrollToPosition };
}

export default useCurrentPageObserver;
