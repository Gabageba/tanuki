import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';

type Props = {
  caption: string;
  children: ReactNode;
};

/** Подпись состояния над рамкой — какой случай показан. */
function CaptionedFrame({ caption, children }: Props) {
  return (
    <Stack gap={6} maw="100%">
      <Text fz={12} c="dimmed" ff="monospace">
        {caption}
      </Text>
      {children}
    </Stack>
  );
}

export default CaptionedFrame;
