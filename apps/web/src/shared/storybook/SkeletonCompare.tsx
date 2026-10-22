import type { ReactNode } from 'react';
import { SimpleGrid, Stack, Text, type BoxProps } from '@mantine/core';

type Props = {
  item: ReactNode;
  skeleton: ReactNode;
  /** Ширина каждой колонки: айтем и скелетон стоят в одинаковых рамках. */
  w?: BoxProps['w'];
};

/** Айтем и его скелетон рядом, в колонках одной ширины, — чтобы сверить их один к одному. */
function SkeletonCompare({ item, skeleton, w }: Props) {
  return (
    <SimpleGrid cols={2} spacing="xl" p="md" w="fit-content">
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
