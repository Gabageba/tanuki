import type { NotificationCategory, NotificationType, UserRole } from '@tanuki/contracts';
import type { notifications } from '../database/schema';

export type NotificationRecord = typeof notifications.$inferSelect;

/** Непрочитанное живёт столько от последнего обновления, потом суточный крон его удаляет. */
export const NOTIFICATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Сколько потоков SSE держим на пользователя; лишние старые закрываются. */
export const MAX_STREAMS_PER_USER = 5;
export const STREAM_HEARTBEAT_MS = 25_000;
/** Имя события-пульса: клиент на него не подписан, а прокси видит живое соединение. */
export const STREAM_HEARTBEAT_EVENT = 'ping';

/** Больше стольких новых записей `newChapters` за один проход крона — один сводный push. */
export const NEW_CHAPTERS_PUSH_LIMIT = 3;

/** Раз в час: инвайты, истёкшие за прошедший час, — окна не пересекаются, повторов нет. */
export const INVITE_EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const NOTIFICATIONS_CLEANUP_JOB_NAME = 'notifications-cleanup';

/** Что нужно, чтобы создать или переписать запись. */
export type NotificationInput = {
  type: NotificationType;
  groupKey: string;
  payload: Record<string, unknown>;
  count?: number;
};

/** Итог upsert: по нему решается, нужен ли push и событие потока. */
export type NotificationWrite = {
  record: NotificationRecord;
  /** Записи не было (или её прочитали) — создана новая. */
  isCreated: boolean;
  /** Запись была, но сменила тип (`sourceDown` → `sourceRecovered`). */
  isTypeChanged: boolean;
};

/** Кому показывается лента: важны только роль и id. */
export type NotificationViewer = { id: string; role: UserRole };

/** Группа закладок с новыми главами — то, что крон закладок отдаёт ленте. */
export type NewChaptersGroup = {
  /** Канонический ключ группы закладки (BookmarksService). */
  key: string;
  titleId: string;
  sourceId: string;
  name: string;
  /** Адрес обложки на источнике, без подписи, и источник, чей это адрес (подпись прокси). */
  coverUrl: string | null;
  coverSourceId: string;
  count: number;
  /** Когда впервые увидели самую свежую из новых глав. */
  latestNewAt: Date | null;
};

/** Новые главы пользователя: группы со счётчиком и ключи групп, чей счётчик сейчас не считается. */
export type NewChaptersSnapshot = {
  groups: NewChaptersGroup[];
  /** Группы в отслеживаемых папках, у которых цель недоступна: «0 новых» тут не значит «прочитано». */
  heldKeys: string[];
};

/** Что показывает системное уведомление и куда ведёт его клик. */
export type PushMessage = {
  title: string;
  body: string;
  /** Тег склеивает повторные push одного рода в одно системное уведомление. */
  tag: string;
  category: NotificationCategory;
  /** Путь в приложении; сервис-воркер открывает его по клику. */
  url: string;
};

export type PushSource = {
  type: NotificationType;
  groupKey: string;
  payload: Record<string, unknown>;
  count: number;
};

export type DeviceIdentity = { fingerprint: string; label: string };
