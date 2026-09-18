import { Group, Skeleton } from '@mantine/core';
function TitleCardTagsSkeleton() {
  return (
    <Group gap={6} flex={1}>
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} h={20} radius="sm" w={50} style={{ flexShrink: 0 }} />
      ))}
    </Group>
  );
}

export default TitleCardTagsSkeleton;
