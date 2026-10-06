import { Box, Group, Text } from '@mantine/core';
import { getPlacementCaption, getSilhouetteSize } from '../lib';
import {
  SHEET_HEIGHT,
  SHEET_POSITION,
  type Device,
  type SheetHeight,
  type SheetPosition,
} from '../models';

type Props = {
  position: SheetPosition;
  height?: SheetHeight;
  device: Device;
};

/** Мини-экран с закрашенной областью drawer и подписью стороны. */
function PlacementSilhouette({ position, height = SHEET_HEIGHT.AUTO, device }: Props) {
  const size = getSilhouetteSize(device);
  const isBottom = position === SHEET_POSITION.BOTTOM;

  return (
    <Group gap="xs" wrap="nowrap">
      <Box
        pos="relative"
        w={size.w}
        h={size.h}
        flex="none"
        bdrs="sm"
        style={{ border: '1px solid var(--mantine-color-default-border)', overflow: 'hidden' }}
      >
        <Box
          pos="absolute"
          bg="var(--mantine-primary-color-light)"
          style={{ border: '1px solid var(--mantine-primary-color-filled)' }}
          top={isBottom ? undefined : 0}
          bottom={0}
          left={position === SHEET_POSITION.RIGHT ? undefined : 0}
          right={position === SHEET_POSITION.LEFT ? undefined : 0}
          w={isBottom ? undefined : size.side}
          h={isBottom ? (height === SHEET_HEIGHT.TALL ? '88%' : '45%') : undefined}
        />
      </Box>
      <Text fz="xs" c="dimmed">
        {getPlacementCaption(position, height, device)}
      </Text>
    </Group>
  );
}

export default PlacementSilhouette;
