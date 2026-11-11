import { useLayoutEffect, useState } from 'react';
import styles from '../Toast.module.scss';

/** Одна DOM-точка перемещается внутрь верхнего dialog: React-поддерево и фокус не пересоздаются. */
function useToastViewport() {
  const [host] = useState(() => {
    const element = document.createElement('div');
    element.className = styles.portal ?? '';
    element.popover = 'manual';
    return element;
  });
  const [viewport, setViewport] = useState({
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    overlay: null as HTMLElement | null,
  });

  useLayoutEffect(() => {
    const update = () => {
      const dialogs = [
        ...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'),
      ].filter((dialog) => dialog.getBoundingClientRect().height > 0);
      const dialog = dialogs.at(-1);
      const target = dialog ?? document.body;
      if (host.parentElement !== target) target.append(host);
      // Top layer сохраняет координаты экрана даже внутри transform модалки.
      // DOM-родитель остаётся dialog, поэтому FocusTrap включает кнопки тостов.
      if (!host.matches(':popover-open')) host.showPopover();
      const visual = window.visualViewport;
      const next = {
        top: visual?.offsetTop ?? 0,
        left: visual?.offsetLeft ?? 0,
        width: visual?.width ?? window.innerWidth,
        height: visual?.height ?? window.innerHeight,
        overlay: dialog ?? null,
      };
      setViewport((previous) =>
        Object.keys(next).every(
          (key) => previous[key as keyof typeof next] === next[key as keyof typeof next],
        )
          ? previous
          : next,
      );
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'aria-modal', 'aria-hidden', 'data-exiting'],
    });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      host.remove();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [host]);

  return { host, ...viewport };
}

export default useToastViewport;
