import { Flex, Skeleton, Stack } from '@mantine/core';
import NotificationRowSkeleton from './NotificationRowSkeleton';

/** Сколько строк рисует скелетон — примерно экран ленты. */
const SKELETON_ROWS = 6;

/** Загрузка ленты: фильтр категорий с «Очистить уведомления» и строки — скелетоном. */
function NotificationsSkeleton() {
  return (
    <Stack gap="md">
      <Flex
        direction={{ base: 'column', xs: 'row' }}
        gap="sm"
        align={{ base: 'stretch', xs: 'center' }}
        justify="space-between"
      >
        <Skeleton h={36} flex={1} maw={360} />
        <Skeleton h={36} w={{ base: '100%', xs: 200 }} flex="none" />
      </Flex>
      <Stack gap="xs">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <NotificationRowSkeleton key={index} />
        ))}
      </Stack>
    </Stack>
  );
}

export default NotificationsSkeleton;
