import { Group, Skeleton, Stack } from '@mantine/core';

/** Заглушка строки на время загрузки — повторяет раскладку GroupedListRow. */
function GroupedListRowSkeleton() {
  return (
    <Group gap="md" wrap="nowrap" px="md" py="xs">
      <Skeleton w={24} h={24} radius="sm" flex="none" />
      <Stack gap={8} flex={1}>
        <Skeleton h={14} w="40%" />
        <Skeleton h={12} w="60%" />
      </Stack>
    </Group>
  );
}

export default GroupedListRowSkeleton;
