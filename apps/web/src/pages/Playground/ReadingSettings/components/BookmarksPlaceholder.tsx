import { Group, Skeleton, Stack } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';

const ROWS = [
  { title: '30%', description: '45%' },
  { title: '24%', description: '38%' },
  { title: '34%', description: '50%' },
  { title: '20%', description: '32%' },
];

/** Место под будущий редактор категорий закладок: только размер блока, без содержимого.
 *  Скелетоны без анимации — чтобы не читались как загрузка. */
function BookmarksPlaceholder() {
  return (
    <GroupedList label="Категории закладок">
      {ROWS.map(({ title, description }, index) => (
        <Group key={index} gap="md" wrap="nowrap" px="md" py="xs">
          <Skeleton animate={false} w={24} h={24} radius="sm" flex="none" />
          <Stack gap={6} flex={1}>
            <Skeleton animate={false} h={12} w={title} />
            <Skeleton animate={false} h={10} w={description} />
          </Stack>
        </Group>
      ))}
    </GroupedList>
  );
}

export default BookmarksPlaceholder;
