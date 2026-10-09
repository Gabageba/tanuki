import { Stack } from '@mantine/core';
import type { NotificationItem } from '@tanuki/contracts';
import NotificationRow from './NotificationRow';

type Props = {
  items: NotificationItem[];
};

function NotificationsList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <Stack gap="xs">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </Stack>
  );
}

export default NotificationsList;
