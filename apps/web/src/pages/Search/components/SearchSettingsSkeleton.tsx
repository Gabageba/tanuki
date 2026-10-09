import { Group, Skeleton } from '@mantine/core';

function SearchSettingsSkeleton() {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Skeleton height={36} flex={{ base: 1, xs: 'none' }} w={{ xs: 135 }} />
      <Skeleton height={36} width={78} />
    </Group>
  );
}

export default SearchSettingsSkeleton;
