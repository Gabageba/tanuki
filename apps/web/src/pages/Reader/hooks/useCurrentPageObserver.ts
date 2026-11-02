import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CURRENT_PAGE_ROOT_MARGIN,
  PIN_RELEASE_EVENTS,
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
  /** Страница, к которой просили прокрутить, пока её ещё не отрисовали, — так бывает при входе
   *  по «Продолжить» на середину главы: страниц ещё нет, они приедут с запросом. */
  const pendingKey = useRef<string | null>(null);
  /** Снимает удержание страницы, к которой прокрутили последней (см. pinPage). */
  const unpin = useRef<(() => void) | null>(null);
  const pinnedKey = useRef<string | null>(null);
  /** Пока страница удерживается, лента прокручивается сама — это не движение читателя. */
  const [isPinned, setIsPinned] = useState(false);

  /**
   * Прокрутка к странице — ещё не конец: страницы выше неё, пока грузятся, держат место по
   * пропорциям-заглушкам, а загрузившись, вырастают до настоящих — и нужная уезжает вниз, а на
   * экран вместо неё выезжает одна из прежних (и тут же сохраняется как позиция). Поэтому до
   * первого собственного движения читателя страница удерживается: каждое изменение высоты ленты
   * снова ставит её на место. ResizeObserver срабатывает раньше, чем пересчитываются пересечения,
   * так что наблюдатель текущей страницы промежуточного сдвига не видит.
   */
  const pinPage = useCallback((element: HTMLElement) => {
    unpin.current?.();
    const pinnedAt = performance.now();
    const position = getReaderPagePosition(element);
    const key = position && getReaderPageKey(position);
    pinnedKey.current = key;
    scrollToReaderPage(element);

    const resizeObserver = new ResizeObserver(() => {
      const current = key ? elements.current.get(key) : undefined;
      if (current?.isConnected) scrollToReaderPage(current);
    });
    resizeObserver.observe(document.body);

    const release = (event?: Event) => {
      // The Home/End or mode-change key can still be bubbling when layout restores the page.
      // Only a subsequent user event should release that newly restored position.
      if (event && event.timeStamp <= pinnedAt) return;
      resizeObserver.disconnect();
      PIN_RELEASE_EVENTS.forEach((type) => window.removeEventListener(type, release));
      window.removeEventListener('pointerdown', handlePointerDown);
      if (unpin.current === release) {
        unpin.current = null;
        pinnedKey.current = null;
        setIsPinned(false);
      }
    };
    // Клик по самому документу — это полоса прокрутки; тап по странице (он прячет шапку) место
    // чтения не меняет и удержание не снимает.
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target === document.documentElement) release();
    };

    PIN_RELEASE_EVENTS.forEach((type) => window.addEventListener(type, release, { passive: true }));
    window.addEventListener('pointerdown', handlePointerDown);
    unpin.current = release;
    setIsPinned(true);
  }, []);

  useEffect(() => () => unpin.current?.(), []);

  useEffect(() => {
    // В горизонтальном режиме прокручивать ленту незачем — и удерживать в ней страницу тоже.
    if (!enabled) {
      unpin.current?.();
      return;
    }

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

  const registerPage = useCallback(
    (element: HTMLElement | null) => {
      const position = element && getReaderPagePosition(element);
      if (!element || !position) return;

      const key = getReaderPageKey(position);
      elements.current.set(key, element);
      // Прокрутка идёт в том же коммите, что и регистрация, — раньше, чем наблюдатель успеет
      // сообщить о первой странице под центром экрана и перезаписать ей восстановленную позицию.
      if (pendingKey.current === key || pinnedKey.current === key) {
        pendingKey.current = null;
        pinPage(element);
      }
      observer.current?.observe(element);

      return () => {
        elements.current.delete(key);
        observer.current?.unobserve(element);
      };
    },
    [pinPage],
  );

  const scrollToPosition = useCallback(
    (position: ReaderPosition) => {
      const key = getReaderPageKey(position);
      const element = elements.current.get(key);
      pendingKey.current = element ? null : key;
      if (element) {
        pinPage(element);
      } else {
        unpin.current?.();
        scrollToReaderPage();
      }
    },
    [pinPage],
  );

  return { registerPage, scrollToPosition, isPinned };
}

export default useCurrentPageObserver;
