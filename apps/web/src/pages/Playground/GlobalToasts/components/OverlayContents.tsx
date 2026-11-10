import { useState } from 'react';
import { Box, Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { ERROR } from '../mocks';
import type { ToastAppearance } from '../models';
import useVisualViewport from '../hooks/useVisualViewport';
import ToastCard from './ToastCard';
import OverlayForm from './OverlayForm';
import styles from '../GlobalToasts.module.scss';

type Props = {
  onClose: () => void;
  isModal: boolean;
  appearance?: Partial<ToastAppearance>;
  toastWidth?: number;
};

function OverlayContents({ onClose, isModal, appearance, toastWidth = 360 }: Props) {
  const [shown, setShown] = useState(true);
  const viewport = useVisualViewport();
  const { ref, height } = useElementSize();
  const compact = viewport.width < 768 || viewport.height < 600;
  const rightOffset = Math.max(0, window.innerWidth - viewport.left - viewport.width);
  return (
    <>
      <Box
        mah={compact ? Math.max(80, viewport.height - height - 110) : undefined}
        style={{ overflowY: 'auto' }}
      >
        <OverlayForm onSubmit={() => setShown(true)} onClose={onClose} isModal={isModal} />
      </Box>
      <Stack
        ref={ref}
        className={styles.overlayHost}
        w={toastWidth}
        maw={`calc(${viewport.width}px - 24px)`}
        mah={viewport.height * 0.45}
        style={{
          overflowY: 'auto',
          right: `calc(${rightOffset}px + max(12px, env(safe-area-inset-right, 0px)))`,
          top: `calc(${viewport.top + viewport.height - height}px - max(12px, env(safe-area-inset-bottom, 0px)))`,
        }}
      >
        {shown && (
          <ToastCard
            appearance={appearance}
            item={{ ...ERROR, title: 'Не удалось сохранить папку' }}
            onDismiss={() => setShown(false)}
          />
        )}
      </Stack>
    </>
  );
}

export default OverlayContents;
