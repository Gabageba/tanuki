import { Group, Skeleton } from '@mantine/core';
import TextSkeleton from '../TextSkeleton';

/** Заглушка строки главы: узел линии прочитанного, номер с названием, дата и кнопка скачивания. */
function ChapterItemSkeleton() {
  return (
    <Group gap="md" wrap="nowrap" pl="md" pr="md" py="xs">
      <Skeleton w={18} h={18} circle flex="none" />
      <TextSkeleton flex={1} w="auto" />
      <TextSkeleton fz={12} w={72} />
      <Skeleton w={28} h={28} flex="none" />
    </Group>
  );
}

export default ChapterItemSkeleton;
