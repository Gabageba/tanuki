import { Group, Skeleton } from '@mantine/core';

/** Сколько чипов рисует скелетон и какой они ширины. */
const CHIPS_COUNT = 5;
const CHIP_WIDTH = 120;
const CHIP_HEIGHT = 32;

/** Строка чипов, пока список источников не пришёл. */
function SourceChipsSkeleton() {
  return (
    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
      {Array.from({ length: CHIPS_COUNT }, (_, index) => (
        <Skeleton key={index} w={CHIP_WIDTH} h={CHIP_HEIGHT} radius="xl" flex="none" />
      ))}
    </Group>
  );
}

export default SourceChipsSkeleton;
