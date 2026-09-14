import type { StackProps } from '@mantine/core';
import { Skeleton, Stack } from '@mantine/core';

type Props = {
  groupHeight: number;
  gap?: StackProps['gap'];
};

function CollapsibleGroupSkeleton({ gap, groupHeight }: Props) {
  return (
    <Stack gap={gap}>
      <Skeleton h={groupHeight} />
      <Skeleton w={91} h={14} />
    </Stack>
  );
}

export default CollapsibleGroupSkeleton;
