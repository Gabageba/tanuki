import { useLayoutEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { Toasts } from '@/shared/lib/toasts/store';
import ToastCard from './ToastCard';
import useToastViewport from './hooks/useToastViewport';
import styles from './Toast.module.scss';

type Props = { bottomOffset?: number };

function ToastHost({ bottomOffset = 0 }: Props) {
  const entries = useSyncExternalStore(Toasts.subscribe, Toasts.getSnapshot);
  const viewport = useToastViewport();
  const { ref, height } = useElementSize();
  const visible = entries.filter((entry) => entry.visible);
  const hasVisible = visible.length > 0;

  useLayoutEffect(() => {
    const update = () => Toasts.setHidden(document.visibilityState === 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useLayoutEffect(() => {
    const dialog = viewport.host.closest<HTMLElement>('[role="dialog"]');
    if (!dialog || (viewport.width >= 768 && viewport.height >= 600) || !hasVisible || height === 0)
      return;
    const body = dialog.querySelector<HTMLElement>('.mantine-Modal-body, .mantine-Drawer-body');
    if (!body) return;
    const inner = dialog.closest<HTMLElement>('.mantine-Modal-inner');
    const header = dialog.querySelector<HTMLElement>(
      '.mantine-Modal-header, .mantine-Drawer-header',
    );
    const available = Math.max(100, viewport.height - height - bottomOffset - 36);
    const previousBody = { maxHeight: body.style.maxHeight, overflowY: body.style.overflowY };
    const previousDialog = dialog.style.maxHeight;
    const previousInner = inner && {
      top: inner.style.top,
      height: inner.style.height,
      paddingTop: inner.style.paddingTop,
      paddingBottom: inner.style.paddingBottom,
    };
    if (inner) {
      // Центрируем модалку в области над стеком, а не за ним.
      Object.assign(inner.style, {
        top: `${viewport.top}px`,
        height: `${viewport.height}px`,
        paddingTop: '12px',
        paddingBottom: `${height + bottomOffset + 24}px`,
      });
      dialog.style.maxHeight = `${available}px`;
      body.style.maxHeight = `${Math.max(60, available - (header?.getBoundingClientRect().height ?? 60))}px`;
    } else {
      body.style.maxHeight = `${Math.max(60, viewport.top + viewport.height - height - bottomOffset - 24 - body.getBoundingClientRect().top)}px`;
    }
    body.style.overflowY = 'auto';
    return () => {
      Object.assign(body.style, previousBody);
      dialog.style.maxHeight = previousDialog;
      if (inner && previousInner) Object.assign(inner.style, previousInner);
    };
  }, [
    viewport.host,
    viewport.overlay,
    viewport.height,
    viewport.width,
    viewport.top,
    height,
    hasVisible,
    bottomOffset,
  ]);

  if (!visible.length) return null;
  const bottom = Math.max(0, window.innerHeight - viewport.top - viewport.height);
  const right = Math.max(0, window.innerWidth - viewport.left - viewport.width);

  return createPortal(
    <Stack
      ref={ref}
      gap={12}
      pos="fixed"
      p={4}
      m={-4}
      w={428}
      maw={`calc(${viewport.width}px - 16px)`}
      mah={Math.max(80, viewport.height * (viewport.overlay ? 0.45 : 0.8) - bottomOffset)}
      className={styles.host}
      style={{
        right: `calc(${right}px + max(12px, env(safe-area-inset-right, 0px)))`,
        bottom: `calc(${bottom + bottomOffset}px + max(12px, env(safe-area-inset-bottom, 0px)))`,
      }}
    >
      {visible.map((entry) => (
        <ToastCard key={entry.id} entry={entry} />
      ))}
    </Stack>,
    viewport.host,
  );
}

export default ToastHost;
