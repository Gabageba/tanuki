import type { ReactNode } from 'react';
import { SimpleGrid, Stack, Text, type BoxProps, type SimpleGridProps } from '@mantine/core';

type Props = {
  item: ReactNode;
  skeleton: ReactNode;
  /** Ширина каждой колонки: айтем и скелетон стоят в одинаковых рамках. */
  w?: BoxProps['w'];
  cols?: SimpleGridProps['cols'];
};

/** Айтем и его скелетон рядом, в колонках одной ширины, — чтобы сверить их один к одному. */
function SkeletonCompare({ item, skeleton, w, cols = 2 }: Props) {
  return (
    <SimpleGrid cols={cols} spacing="xl" p="md" w="fit-content">
      <Stack gap="xs" w={w}>
        <Text c="dimmed" fz="xs">
          Айтем
        </Text>
        {item}
      </Stack>
      <Stack gap="xs" w={w}>
        <Text c="dimmed" fz="xs">
          Скелетон
        </Text>
        {skeleton}
      </Stack>
    </SimpleGrid>
  );
}

export default SkeletonCompare;
