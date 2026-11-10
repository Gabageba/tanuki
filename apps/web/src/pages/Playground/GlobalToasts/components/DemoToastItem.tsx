import { Box } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DemoToast, ToastAppearance } from '../models';
import ToastCard from './ToastCard';
import { getAnnouncementRole } from '../lib';

type Props = {
  item: DemoToast;
  appearance?: Partial<ToastAppearance>;
  actions?: ReactNode;
  onDismiss: () => void;
  onOpen?: () => void;
  announce?: boolean;
  onPause: (id: string, active: boolean, focus?: boolean) => void;
};

function DemoToastItem({
  item,
  appearance,
  actions,
  onDismiss,
  onOpen,
  onPause,
  announce = true,
}: Props) {
  return (
    <Box
      role={announce ? getAnnouncementRole(item.tone) : undefined}
      aria-atomic
      onMouseEnter={() => onPause(item.id, true)}
      onMouseLeave={() => onPause(item.id, false)}
      onFocusCapture={() => onPause(item.id, true, true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onPause(item.id, false, true);
      }}
    >
      <ToastCard
        item={item}
        appearance={appearance}
        actions={actions}
        onDismiss={onDismiss}
        onOpen={onOpen}
        animate
      />
    </Box>
  );
}

export default DemoToastItem;
