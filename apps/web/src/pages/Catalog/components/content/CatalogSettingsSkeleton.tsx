import { Flex, Group, Skeleton } from '@mantine/core';

function CatalogSettingsSkeleton() {
  return (
    <Flex gap="sm" justify="space-between" direction={{ base: 'column', xs: 'row' }} mb="md">
      <Skeleton height={36} w={{ base: '100%', xs: 135 }} />
      <Group gap="xs">
        <Skeleton height={36} width={200} flex={{ base: 1, xs: 'none' }} />
        <Skeleton height={36} width={78} />
      </Group>
    </Flex>
  );
}

export default CatalogSettingsSkeleton;
