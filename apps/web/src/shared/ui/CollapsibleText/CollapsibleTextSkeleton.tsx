import { Skeleton, Stack } from '@mantine/core';

type Props = {
  textHeight: number;
};

function CollapsibleTextSkeleton({ textHeight }: Props) {
  return (
    <Stack gap={4}>
      <Skeleton h={textHeight} />
      <Skeleton h={14} w={125} />
    </Stack>
  );
}

export default CollapsibleTextSkeleton;
