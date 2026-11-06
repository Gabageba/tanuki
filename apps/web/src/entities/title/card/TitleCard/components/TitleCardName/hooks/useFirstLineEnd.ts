import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Где кончается первая строка текста — отступ от левого края элемента в px. Строки текста
 * браузер отдаёт только через Range: у каждой строки свой прямоугольник, первый — первая строка.
 * Перемеряется при смене ширины и загрузке шрифта: ширина глифов может измениться,
 * даже когда размеры самого блока остались прежними.
 */
function useFirstLineEnd<T extends HTMLElement>(text: string, enabled: boolean) {
  const ref = useRef<T>(null);
  const [end, setEnd] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const textNode = element?.firstChild;
    if (!enabled || !element || !textNode) return undefined;
    let isActive = true;

    const measure = () => {
      if (!isActive) return;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const [firstLine] = range.getClientRects();
      setEnd(firstLine ? firstLine.right - element.getBoundingClientRect().left : null);
    };
    measure();
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      isActive = false;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [text, enabled]);

  return { ref, end };
}

export default useFirstLineEnd;
