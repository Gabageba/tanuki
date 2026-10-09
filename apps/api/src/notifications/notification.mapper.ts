import {
  getNotificationCategory,
  NOTIFICATION_TYPE,
  type NotificationItem,
  SOURCE_STATUS_REASON,
  SourceStatusReasonSchema,
} from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import { IMAGE_FORMAT } from '../img-proxy/models';
import { buildSignedImageUrl } from '../img-proxy/sign.util';
import type { NotificationRecord } from './models';
import { text } from './payload.util';

/** Причина из payload; неизвестное значение (запись старой версии) читается как «сбои запросов». */
const toStatusReason = (value: unknown) => {
  const parsed = SourceStatusReasonSchema.safeParse(value);
  return parsed.success ? parsed.data : SOURCE_STATUS_REASON.REQUEST_FAILURES;
};

/**
 * Запись БД → элемент ленты. Payload в базе — снимок на момент события, так что собирается
 * явно по типу: лишние поля наружу не уходят, а обложка подписывается здесь (подпись прокси
 * живёт час, а запись — до 30 дней).
 */
export const toNotificationItem = (
  record: NotificationRecord,
  imageSecret: string,
): NotificationItem => {
  const base = {
    id: record.id,
    category: getNotificationCategory(record.type),
    count: record.count,
    createdAt: toServerDateTime(record.createdAt.getTime()),
    updatedAt: toServerDateTime(record.updatedAt.getTime()),
  };
  const { payload } = record;

  switch (record.type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS: {
      const sourceId = text(payload['sourceId']);
      const coverUrl = text(payload['coverUrl']);
      const coverSourceId = text(payload['coverSourceId']) || sourceId;
      return {
        ...base,
        type: record.type,
        payload: {
          titleId: text(payload['titleId']),
          sourceId,
          name: text(payload['name']),
          coverUrl: coverUrl
            ? buildSignedImageUrl(imageSecret, coverSourceId, coverUrl, {
                width: 360,
                format: IMAGE_FORMAT.WEBP,
              })
            : '',
        },
      };
    }
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
      return { ...base, type: record.type, payload: {} };
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return { ...base, type: record.type, payload: { device: text(payload['device']) } };
    case NOTIFICATION_TYPE.SOURCE_DOWN:
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return {
        ...base,
        type: record.type,
        payload: {
          sourceId: text(payload['sourceId']),
          reason: toStatusReason(payload['reason']),
        },
      };
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return { ...base, type: record.type, payload: { sourceId: text(payload['sourceId']) } };
    case NOTIFICATION_TYPE.INVITE_USED:
      return {
        ...base,
        type: record.type,
        payload: { inviteId: text(payload['inviteId']), username: text(payload['username']) },
      };
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return { ...base, type: record.type, payload: { inviteId: text(payload['inviteId']) } };
  }
};
