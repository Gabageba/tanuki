import { Image, ThemeIcon } from '@mantine/core';
import { NOTIFICATION_TYPE, type NotificationItem } from '@tanuki/contracts';
import {
  getNotificationIcon,
  getNotificationTone,
  getToneColor,
} from '@/entities/notification/lib';

type Props = {
  item: NotificationItem;
};

/** Слева в строке: обложка тайтла у новых глав, у остальных событий — иконка типа в тонированном квадрате. */
function NotificationLeading({ item }: Props) {
  if (item.type === NOTIFICATION_TYPE.NEW_CHAPTERS && item.payload.coverUrl) {
    return (
      <Image
        src={item.payload.coverUrl}
        alt={item.payload.name}
        w={40}
        h={54}
        radius="sm"
        fit="cover"
        flex="none"
      />
    );
  }

  return (
    <ThemeIcon
      variant="muted"
      color={getToneColor(getNotificationTone(item.type))}
      size={40}
      radius="md"
      flex="none"
    >
      {getNotificationIcon(item.type)}
    </ThemeIcon>
  );
}

export default NotificationLeading;
