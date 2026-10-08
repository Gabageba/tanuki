import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Где кончается первая строка текста — отступ от левого края элемента в px. Строки текста
 * браузер отдаёт только через Range: у каждой строки свой прямоугольник, первый — первая строка.
 * Перемеряется при смене ширины.
 */
function useFirstLineEnd<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [end, setEnd] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const textNode = element?.firstChild;
    if (!element || !textNode) return undefined;

    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const [firstLine] = range.getClientRects();
      setEnd(firstLine ? firstLine.right - element.getBoundingClientRect().left : null);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return { ref, end };
}

export default useFirstLineEnd;
