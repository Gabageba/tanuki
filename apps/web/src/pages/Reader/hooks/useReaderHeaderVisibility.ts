import { useEffect, useEffectEvent, useRef, useState } from 'react';

const SCROLL_DIRECTION_THRESHOLD = 8;

type Params = {
  /** Прокрутка идёт не от читателя: лента подгоняет удерживаемую страницу, пока грузятся
   *  картинки над ней. Иначе каждая подгонка вниз прятала бы шапку — даже открытую тапом. */
  ignoreScroll: boolean;
};

function useReaderHeaderVisibility({ ignoreScroll }: Params) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useEffectEvent(() => {
    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY.current;
    // Точку отсчёта двигаем и при подгонке — иначе первый же скролл читателя после неё сравнился
    // бы с позицией до прыжка.
    lastScrollY.current = scrollY;

    if (ignoreScroll) return;

    if (scrollY <= 0) {
      setVisible(true);
    } else if (Math.abs(delta) > SCROLL_DIRECTION_THRESHOLD) {
      setVisible(delta < 0);
    }
  });

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = () => setVisible((current) => !current);

  return { visible, toggle };
}

export default useReaderHeaderVisibility;
