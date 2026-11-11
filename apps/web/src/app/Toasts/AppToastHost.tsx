import { useLayoutEffect, useState } from 'react';
import ToastHost from '@/shared/ui/Toast/ToastHost';

/** Реальная нижняя панель, включая её отсутствие на входе, в читалке и на десктопе. */
function AppToastHost() {
  const [bottomOffset, setBottomOffset] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const footer = document.querySelector<HTMLElement>('[data-toast-footer]');
      setBottomOffset(footer?.getBoundingClientRect().height ?? 0);
    };
    const resize = new ResizeObserver(measure);
    const observe = () => {
      resize.disconnect();
      const footer = document.querySelector('[data-toast-footer]');
      if (footer) resize.observe(footer);
      measure();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });
    observe();
    window.addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return <ToastHost bottomOffset={bottomOffset} />;
}

export default AppToastHost;
