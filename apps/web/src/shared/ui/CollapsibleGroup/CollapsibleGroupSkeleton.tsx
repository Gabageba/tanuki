import type { StackProps } from '@mantine/core';
import { Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '../TextSkeleton';

type Props = {
  groupHeight: number;
  gap?: StackProps['gap'];
};

function CollapsibleGroupSkeleton({ gap, groupHeight }: Props) {
  return (
    <Stack gap={gap}>
      <Skeleton h={groupHeight} />
      <TextSkeleton lh="tight" w={91} />
    </Stack>
  );
}

export default CollapsibleGroupSkeleton;
