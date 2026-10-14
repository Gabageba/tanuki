import { Group, Skeleton, Stack } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import RibbonSkeleton from './RibbonSkeleton';

/** Ширины плашек вместо чипов — разные, как у настоящих названий блоков. */
const CHIP_WIDTHS = [128, 104, 88, 140, 112, 96];

type Props = {
  /** Сколько блоков включено — известно из `Source.homeSections` и настроек. */
  count: number;
};

/** Z2 — скелетон секции под S2: заголовок источника, плашки вместо чипов блоков и одна лента. */
function HomeSourceTabsSkeleton({ count }: Props) {
  return (
    <Stack gap="md">
      <SourceTitleSkeleton />
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
          {Array.from({ length: count }, (_, index) => (
            <Skeleton
              key={index}
              w={CHIP_WIDTHS[index % CHIP_WIDTHS.length]}
              h={28}
              radius="xl"
              flex="none"
            />
          ))}
        </Group>
        <RibbonSkeleton />
      </Stack>
    </Stack>
  );
}

export default HomeSourceTabsSkeleton;
