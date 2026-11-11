import type { TFunction } from 'i18next';
import {
  NOTIFICATION_TYPE,
  type NotificationCategory,
  type NotificationItem,
  type NotificationsPage,
} from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND } from '@/shared/lib/toasts/models';
import {
  getNotificationDetail,
  getNotificationIcon,
  getNotificationTitle,
  getNotificationTone,
} from './lib';

type Params = { item: NotificationItem; t: TFunction; onOpen: () => void };

const isSecurity = (item: NotificationItem) => {
  switch (item.type) {
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return true;
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
    case NOTIFICATION_TYPE.SOURCE_DOWN:
    case NOTIFICATION_TYPE.PARSER_DOWN:
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
    case NOTIFICATION_TYPE.SOURCE_IMPORT_FINISHED:
    case NOTIFICATION_TYPE.INVITE_USED:
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return false;
  }
};

export const showNotificationToast = ({ item, t, onOpen }: Params) => {
  const security = isSecurity(item);
  return Toasts.show({
    id: `notification-${item.id}`,
    key: `notification-${item.id}`,
    group: item.category,
    tone: getNotificationTone(item.type),
    title: getNotificationTitle(item, t),
    description: getNotificationDetail(item, t),
    icon: getNotificationIcon(item.type),
    onOpen,
    kind: security ? TOAST_KIND.SECURITY : TOAST_KIND.MESSAGE,
    readerAllowed: security,
  });
};

export const removeNotificationToast = (id?: string) => {
  if (id) Toasts.close(`notification-${id}`);
  else Toasts.removeWhere((entry) => entry.id.startsWith('notification-'));
};

export const removeNotificationCategoryToasts = (categories: NotificationCategory[]) =>
  Toasts.removeWhere(
    (entry) =>
      entry.id.startsWith('notification-') &&
      (categories.length === 0 || categories.some((category) => entry.group === category)),
  );

/** Пакетное SSE-удаление не содержит id: сверяем только уже известные тосты с серверной лентой. */
export const reconcileNotificationToasts = async () => {
  const owner = Toasts.getOwnerVersion();
  const pending = new Map(
    Toasts.getSnapshot()
      .filter((entry) => entry.id.startsWith('notification-'))
      .map((entry) => [entry.id, entry.revision]),
  );
  if (!pending.size) return;
  const actual = new Set<string>();
  let loaded = 0;
  let page = 1;
  try {
    for (;;) {
      const data = await apiFetch<NotificationsPage>(`/notifications?page=${page}`);
      data.items.forEach((item) => actual.add(`notification-${item.id}`));
      loaded += data.items.length;
      if (loaded >= data.total || data.items.length === 0) break;
      page++;
    }
  } catch {
    return;
  }
  if (owner !== Toasts.getOwnerVersion()) return;
  Toasts.removeWhere((entry) => pending.get(entry.id) === entry.revision && !actual.has(entry.id));
};
