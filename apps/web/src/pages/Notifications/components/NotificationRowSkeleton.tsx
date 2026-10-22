import { Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Строка ленты скелетоном: квадрат слева, заголовок и подпись, корзина справа — как `NotificationRow`. */
function NotificationRowSkeleton() {
  return (
    <Card withBorder radius="md" p="sm">
      <Group wrap="nowrap" gap="sm">
        <Skeleton w={40} h={40} radius="md" flex="none" />
        <Stack gap={2} flex={1} miw={0}>
          <TextSkeleton fz="sm" lh="tight" w="70%" />
          <TextSkeleton fz="xs" lh="tight" w="40%" />
        </Stack>
        <Skeleton w={28} h={28} flex="none" />
      </Group>
    </Card>
  );
}

export default NotificationRowSkeleton;
