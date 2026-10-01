import { Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '../TextSkeleton';

/** Заглушка строки на время загрузки — повторяет раскладку GroupedListRow. */
function GroupedListRowSkeleton() {
  return (
    <Group gap="md" wrap="nowrap" px="md" py="xs">
      <Skeleton w={24} h={24} radius="sm" flex="none" />
      <Stack gap={4} flex={1}>
        <TextSkeleton fz={14} lh="tight" w="40%" />
        <TextSkeleton fz={12} lh="tight" w="60%" />
      </Stack>
    </Group>
  );
}

export default GroupedListRowSkeleton;
