import { Group, Skeleton, Stack } from '@mantine/core';
import BlockLoader from '@/shared/ui/BlockLoader';

/**
 * Загрузка /bookmarks. Папки встроенные и есть всегда — полоса вкладок идёт скелетоном. А что в
 * папке, заранее неизвестно: вместо сетки карточек, которая могла бы смениться пустым состоянием,
 * — спиннер.
 */
function BookmarksSkeleton() {
  return (
    <Stack gap="md">
      <Group gap="lg" wrap="nowrap" style={{ overflow: 'hidden' }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} h={20} w={100} flex="none" />
        ))}
      </Group>
      <BlockLoader />
    </Stack>
  );
}

export default BookmarksSkeleton;
