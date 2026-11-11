import { useEffect, useState } from 'react';
import { getVisualViewport } from '../lib';

function useVisualViewport() {
  const [viewport, setViewport] = useState(getVisualViewport);
  useEffect(() => {
    const update = () => setViewport(getVisualViewport());
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);
  return viewport;
}

export default useVisualViewport;
