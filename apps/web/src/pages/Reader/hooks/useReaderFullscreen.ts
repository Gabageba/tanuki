import { useCallback, useEffect, useRef, useState } from 'react';

function useReaderFullscreen() {
  const [active, setActive] = useState(Boolean(document.fullscreenElement));
  const supported = Boolean(
    document.fullscreenEnabled && document.documentElement.requestFullscreen,
  );
  const ownsFullscreen = useRef(false);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => {
      disposed.current = true;
      document.removeEventListener('fullscreenchange', sync);
      if (ownsFullscreen.current && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!supported) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        ownsFullscreen.current = false;
      } else {
        ownsFullscreen.current = true;
        await document.documentElement.requestFullscreen();
        if (disposed.current && document.fullscreenElement) await document.exitFullscreen();
      }
    } catch {
      // Browser policy can reject fullscreen; reading remains available.
    }
  }, [supported]);

  return { active, supported, toggle };
}

export default useReaderFullscreen;
