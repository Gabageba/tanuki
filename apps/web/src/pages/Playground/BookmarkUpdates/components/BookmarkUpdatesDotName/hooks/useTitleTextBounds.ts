import { useLayoutEffect, useRef, useState } from 'react';
import type { TitleTextBounds } from '../../../models';

/** Видимые строки clamped-текста: скрытые строки Range тоже возвращает, поэтому отсекаем
 * их по нижнему краю элемента. Перемеряем и при загрузке шрифта, и при изменении ширины. */
function useTitleTextBounds(name: string, enabled: boolean) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [bounds, setBounds] = useState<TitleTextBounds | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const textNode = element?.firstChild;
    if (!enabled || !element || !textNode) return undefined;
    let isActive = true;

    const measure = () => {
      if (!isActive) return;
      const box = element.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const visibleLines = [...range.getClientRects()].filter(
        (line) => line.top < box.bottom && line.bottom > box.top,
      );
      const first = visibleLines[0];
      const last = visibleLines.at(-1);
      if (!first || !last) return;
      const isClamped = element.scrollHeight > element.clientHeight + 1;
      let lastLineEnd = last.right - box.left;
      if (isClamped) {
        // Range не включает сгенерированное line-clamp многоточие. При balance последняя
        // строка бывает заметно короче поля — точку привязываем к ней, а не к правому краю.
        const font = getComputedStyle(element);
        const context = document.createElement('canvas').getContext('2d');
        if (context) context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
        const ellipsisWidth = context?.measureText('…').width ?? parseFloat(font.fontSize);
        lastLineEnd = Math.min(lastLineEnd + ellipsisWidth, box.width);
      }
      const next: TitleTextBounds = {
        firstLineEnd: first.right - box.left,
        lastLineEnd,
        isMultiline: last.top > first.top + 1,
        isClamped,
      };
      setBounds((previous) =>
        previous &&
        previous.firstLineEnd === next.firstLineEnd &&
        previous.lastLineEnd === next.lastLineEnd &&
        previous.isMultiline === next.isMultiline &&
        previous.isClamped === next.isClamped
          ? previous
          : next,
      );
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
  }, [name, enabled]);

  return { ref, bounds };
}

export default useTitleTextBounds;
