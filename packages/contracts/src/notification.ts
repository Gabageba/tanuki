import { z } from 'zod';
import { SourceStatusReasonSchema } from './source';
import type { EnumLiteralsOf } from './utils';

export const NOTIFICATION_CATEGORY = {
  CHAPTERS: 'chapters',
  ACCOUNT: 'account',
  SOURCES: 'sources',
  ADMINISTRATION: 'administration',
} as const;
export type NotificationCategory = EnumLiteralsOf<typeof NOTIFICATION_CATEGORY>;
export const NotificationCategorySchema = z.enum(NOTIFICATION_CATEGORY);

export const NOTIFICATION_TYPE = {
  NEW_CHAPTERS: 'newChapters',
  EMAIL_CHANGED: 'emailChanged',
  DELETION_REQUESTED: 'deletionRequested',
  NEW_DEVICE_LOGIN: 'newDeviceLogin',
  SOURCE_DOWN: 'sourceDown',
  SOURCE_RECOVERED: 'sourceRecovered',
  PARSER_DOWN: 'parserDown',
  PARSER_RECOVERED: 'parserRecovered',
  INVITE_USED: 'inviteUsed',
  INVITE_EXPIRED: 'inviteExpired',
  SOURCE_IMPORT_FINISHED: 'sourceImportFinished',
} as const;
export type NotificationType = EnumLiteralsOf<typeof NOTIFICATION_TYPE>;
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPE);

/** Какой категории принадлежит тип: по ней работают фильтр ленты, тост и тумблеры push. */
export const getNotificationCategory = (type: NotificationType): NotificationCategory => {
  switch (type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return NOTIFICATION_CATEGORY.CHAPTERS;
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
    case NOTIFICATION_TYPE.SOURCE_IMPORT_FINISHED:
      return NOTIFICATION_CATEGORY.ACCOUNT;
    case NOTIFICATION_TYPE.SOURCE_DOWN:
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
      return NOTIFICATION_CATEGORY.SOURCES;
    case NOTIFICATION_TYPE.PARSER_DOWN:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
    case NOTIFICATION_TYPE.INVITE_USED:
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return NOTIFICATION_CATEGORY.ADMINISTRATION;
  }
};

/** Типы категории — для выборки ленты и для тумблеров push. */
export const getNotificationTypes = (category: NotificationCategory): NotificationType[] =>
  Object.values(NOTIFICATION_TYPE).filter((type) => getNotificationCategory(type) === category);

/** Категории, которые видят только админы и модераторы. */
export const isStaffNotificationCategory = (category: NotificationCategory) =>
  category === NOTIFICATION_CATEGORY.ADMINISTRATION;

/** Через сколько записей ленты сервер начинает удалять самые старые. */
export const NOTIFICATIONS_PER_USER_LIMIT = 200;
export const NOTIFICATIONS_PAGE_SIZE = 20;

const BASE = {
  id: z.string().uuid(),
  category: NotificationCategorySchema,
  /** У `newChapters` — сколько новых глав у тайтла, у остальных всегда 1. */
  count: z.number().int().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/**
 * Запись ленты. `payload` — снимок того, что нужно для текста и ссылки: сам текст собирает
 * клиент по `type` и `payload`.
 */
export const NotificationItemSchema = z.discriminatedUnion('type', [
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.NEW_CHAPTERS),
    payload: z.object({
      titleId: z.string(),
      sourceId: z.string(),
      name: z.string(),
      /** Подписанный адрес обложки через img-прокси; пусто, когда обложки нет. */
      coverUrl: z.string(),
    }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.EMAIL_CHANGED),
    payload: z.object({}),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.DELETION_REQUESTED),
    payload: z.object({}),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.NEW_DEVICE_LOGIN),
    /** Подпись устройства: «Chrome · macOS». */
    payload: z.object({ device: z.string() }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.SOURCE_DOWN),
    payload: z.object({ sourceId: z.string(), reason: SourceStatusReasonSchema }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.SOURCE_RECOVERED),
    payload: z.object({ sourceId: z.string() }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.PARSER_DOWN),
    payload: z.object({ sourceId: z.string(), reason: SourceStatusReasonSchema }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.PARSER_RECOVERED),
    payload: z.object({ sourceId: z.string() }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.INVITE_USED),
    payload: z.object({ inviteId: z.string(), username: z.string() }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.INVITE_EXPIRED),
    payload: z.object({ inviteId: z.string() }),
  }),
  z.object({
    ...BASE,
    type: z.literal(NOTIFICATION_TYPE.SOURCE_IMPORT_FINISHED),
    /** Сколько отметок «где остановился» перенесено из скольких ожидавших. */
    payload: z.object({
      sourceId: z.string(),
      transferred: z.number().int().min(0),
      total: z.number().int().min(0),
    }),
  }),
]);
export type NotificationItem = z.infer<typeof NotificationItemSchema>;

/** Список категорий в адресе: `?category=chapters,account`. Пусто — все доступные. */
const CategoriesParamSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value),
  z.array(NotificationCategorySchema).optional(),
);

export const NotificationsQuerySchema = z.object({
  /** Нет — все доступные категории. */
  category: CategoriesParamSchema,
  /** С единицы. */
  page: z.coerce.number().int().min(1).default(1),
});
export type NotificationsQuery = z.infer<typeof NotificationsQuerySchema>;

export const NotificationsPageSchema = z.object({
  items: z.array(NotificationItemSchema),
  page: z.number().int(),
  total: z.number().int(),
});
export type NotificationsPage = z.infer<typeof NotificationsPageSchema>;

export const DeleteNotificationsQuerySchema = z.object({
  category: CategoriesParamSchema,
});
export type DeleteNotificationsQuery = z.infer<typeof DeleteNotificationsQuerySchema>;

export const UnreadCountSchema = z.object({ count: z.number().int().min(0) });
export type UnreadCount = z.infer<typeof UnreadCountSchema>;

/** Что происходит с записью в потоке SSE (`GET /notifications/stream`). */
export const NOTIFICATION_STREAM_EVENT = {
  CREATED: 'created',
  UPDATED: 'updated',
  REMOVED: 'removed',
} as const;
export type NotificationStreamEventType = EnumLiteralsOf<typeof NOTIFICATION_STREAM_EVENT>;

export const NotificationStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(NOTIFICATION_STREAM_EVENT.CREATED),
    notification: NotificationItemSchema,
  }),
  z.object({
    type: z.literal(NOTIFICATION_STREAM_EVENT.UPDATED),
    notification: NotificationItemSchema,
  }),
  /** Запись удалена (прочитана в другой вкладке); `id` нет, когда удалена пачка. */
  z.object({
    type: z.literal(NOTIFICATION_STREAM_EVENT.REMOVED),
    id: z.string().uuid().optional(),
  }),
]);
export type NotificationStreamEvent = z.infer<typeof NotificationStreamEventSchema>;

/** Управление соединением SSE, отдельно от событий записей ленты. */
export const NOTIFICATION_STREAM_CONTROL_EVENT = {
  STOP: 'stop',
} as const;
export type NotificationStreamControlEvent = EnumLiteralsOf<
  typeof NOTIFICATION_STREAM_CONTROL_EVENT
>;

export const NOTIFICATION_STREAM_STOP_REASON = {
  CONNECTION_LIMIT: 'connectionLimit',
} as const;
export type NotificationStreamStopReason = EnumLiteralsOf<typeof NOTIFICATION_STREAM_STOP_REASON>;

export const NotificationStreamStopSchema = z.object({
  reason: z.literal(NOTIFICATION_STREAM_STOP_REASON.CONNECTION_LIMIT),
});
export type NotificationStreamStop = z.infer<typeof NotificationStreamStopSchema>;

/** Push — опция инстанса: без VAPID-ключей `enabled` false, а `publicKey` пуст. */
export const PushConfigSchema = z.object({
  enabled: z.boolean(),
  publicKey: z.string(),
});
export type PushConfig = z.infer<typeof PushConfigSchema>;

export const PushSubscriptionInputSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInputSchema>;

export const DeletePushSubscriptionRequestSchema = z.object({
  endpoint: z.string().url().max(2048),
});
export type DeletePushSubscriptionRequest = z.infer<typeof DeletePushSubscriptionRequestSchema>;
