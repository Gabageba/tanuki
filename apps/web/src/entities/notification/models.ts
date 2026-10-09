import type { EnumLiteralsOf } from '@tanuki/contracts';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY = ['notifications-unread-count'] as const;
export const PUSH_CONFIG_QUERY_KEY = ['notifications-push-config'] as const;
export const PUSH_SUBSCRIPTION_QUERY_KEY = ['push-subscription'] as const;

/** Адрес потока событий открытого приложения (SSE, тот же origin, сессионная cookie). */
export const NOTIFICATIONS_STREAM_URL = '/api/v1/notifications/stream';

/** Запасной опрос счётчика, пока поток не подключён. */
export const UNREAD_COUNT_POLL_MS = 60_000;

/** Паузы перед повторным подключением закрытого потока: растут вдвое до потолка. */
export const STREAM_RECONNECT_BASE_MS = 1_000;
export const STREAM_RECONNECT_MAX_MS = 30_000;

/** На экране не больше стольки тостов: приходит следующий — самый старый закрывается. */
export const MAX_TOASTS = 3;

/** Тон уведомления: безопасность — красный, источник лёг — золотой, ожил — зелёный. */
export const NOTIFICATION_TONE = {
  ACCENT: 'accent',
  DANGER: 'danger',
  WARNING: 'warning',
  SUCCESS: 'success',
  NEUTRAL: 'neutral',
} as const;
export type NotificationTone = EnumLiteralsOf<typeof NOTIFICATION_TONE>;

/** Состояние push на этом устройстве — от него зависит тумблер в настройках. */
export const PUSH_DEVICE_STATE = {
  UNSUPPORTED: 'unsupported',
  IOS_NOT_INSTALLED: 'iosNotInstalled',
  DENIED: 'denied',
  OFF: 'off',
  ON: 'on',
  EXPIRED: 'expired',
} as const;
export type PushDeviceState = EnumLiteralsOf<typeof PUSH_DEVICE_STATE>;
