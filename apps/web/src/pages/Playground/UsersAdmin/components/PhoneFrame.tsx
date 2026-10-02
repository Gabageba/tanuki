import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { MOBILE_FRAME_WIDTH } from '../models';

type Props = {
  children: ReactNode;
};

/** Рамка шириной телефона — вариант смотрится в ней, а не при сжатом окне. */
function PhoneFrame({ children }: Props) {
  return (
    <Box
      w={MOBILE_FRAME_WIDTH}
      maw="100%"
      p="md"
      style={{
        border: '1px dashed var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      {children}
    </Box>
  );
}

export default PhoneFrame;
