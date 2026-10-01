import type { ReactNode } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { MOBILE_FRAME_WIDTH } from '../models';

type Props = {
  desktopWidth: number;
  /** narrow — вариант стоит в рамке телефона: брейкпоинты смотрят на окно, а не на рамку. */
  render: (narrow: boolean) => ReactNode;
};

/** Десктоп и рамка телефона рядом. */
function DeviceFrames({ desktopWidth, render }: Props) {
  return (
    <Group align="flex-start" gap="xl" mt="xs">
      <Stack gap={6} w={desktopWidth} maw="100%">
        <Text fz={12} c="dimmed">
          Десктоп
        </Text>
        {render(false)}
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed">
          Телефон
        </Text>
        <Box
          w={MOBILE_FRAME_WIDTH}
          maw="100%"
          p="md"
          style={{
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          {render(true)}
        </Box>
      </Stack>
    </Group>
  );
}

export default DeviceFrames;
