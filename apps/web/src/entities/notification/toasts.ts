import { notifications } from '@mantine/notifications';
import type { TFunction } from 'i18next';
import type { NotificationItem } from '@tanuki/contracts';
import {
  getNotificationDetail,
  getNotificationIcon,
  getNotificationTitle,
  getNotificationTone,
  getToneColor,
  getToneToastDuration,
} from './lib';
import { MAX_TOASTS } from './models';

/** Тосты, которые сейчас на экране, от старого к новому. */
let visibleToastIds: string[] = [];

type Params = {
  item: NotificationItem;
  t: TFunction;
  /** Клик по тосту: перейти к цели (и считать уведомление прочитанным). */
  onOpen: () => void;
};

/**
 * Тост о важном событии: тон и время жизни по тону, весь тост кликабелен. На экране не больше
 * `MAX_TOASTS` — когда приходит следующий, самый старый закрывается. Повторное событие той же
 * записи заменяет её тост, а не добавляет второй.
 */
export const showNotificationToast = ({ item, t, onOpen }: Params) => {
  const tone = getNotificationTone(item.type);
  const id = `notification-${item.id}`;

  if (visibleToastIds.includes(id)) {
    notifications.hide(id);
    visibleToastIds = visibleToastIds.filter((toastId) => toastId !== id);
  }
  while (visibleToastIds.length >= MAX_TOASTS) {
    const oldest = visibleToastIds.shift();
    if (oldest) notifications.hide(oldest);
  }
  visibleToastIds.push(id);

  notifications.show({
    id,
    color: getToneColor(tone),
    icon: getNotificationIcon(item.type, 18),
    title: getNotificationTitle(item, t),
    message: getNotificationDetail(item, t),
    autoClose: getToneToastDuration(tone),
    style: { cursor: 'pointer' },
    onClick: (event) => {
      // Крестик закрывает тост и ни к чему не ведёт.
      if (event.target instanceof Element && event.target.closest('button')) return;
      notifications.hide(id);
      onOpen();
    },
    onClose: () => {
      visibleToastIds = visibleToastIds.filter((toastId) => toastId !== id);
    },
  });
};
