import { Group, Skeleton, Stack } from '@mantine/core';

function SourceTitleSkeleton() {
  return (
    <Group flex={1}>
      <Skeleton width={40} height={40} />
      <Stack gap={8}>
        <Skeleton width={250} height={16} />
        <Skeleton width={100} height={10} />
      </Stack>
    </Group>
  );
}

export default SourceTitleSkeleton;
