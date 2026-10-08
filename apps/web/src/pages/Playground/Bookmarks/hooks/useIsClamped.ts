import { useLayoutEffect, useRef, useState } from 'react';

/** Обрезан ли текст по `lineClamp`: высота содержимого больше видимой. Перепроверяется при
 *  смене ширины — та же карточка в сетке и на телефоне обрезается по-разному. */
function useIsClamped<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [isClamped, setIsClamped] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const check = () => setIsClamped(element.scrollHeight > element.clientHeight + 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return { ref, isClamped };
}

export default useIsClamped;
