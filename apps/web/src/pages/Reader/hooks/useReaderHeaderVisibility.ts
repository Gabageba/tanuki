import { useEffect, useRef, useState } from 'react';

const SCROLL_DIRECTION_THRESHOLD = 8;

function useReaderHeaderVisibility() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY.current;

      if (scrollY <= 0) {
        setVisible(true);
      } else if (Math.abs(delta) > SCROLL_DIRECTION_THRESHOLD) {
        setVisible(delta < 0);
      }

      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = () => setVisible((current) => !current);

  return { visible, toggle };
}

export default useReaderHeaderVisibility;
