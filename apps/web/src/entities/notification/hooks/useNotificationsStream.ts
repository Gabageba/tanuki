import { useEffect, useEffectEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  NOTIFICATION_STREAM_EVENT,
  NOTIFICATION_STREAM_CONTROL_EVENT,
  NotificationStreamEventSchema,
  NotificationStreamStopSchema,
  type NotificationItem,
} from '@tanuki/contracts';
import { getNotificationTargetPath, hasNotificationToast } from '../lib';
import {
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_STREAM_URL,
  STREAM_RECONNECT_BASE_MS,
  STREAM_RECONNECT_MAX_MS,
  UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
} from '../models';
import { setStreamConnected } from '../streamStatus';
import {
  reconcileNotificationToasts,
  removeNotificationToast,
  showNotificationToast,
} from '../toasts';
import { Toasts } from '@/shared/lib/toasts/store';
import useRemoveNotification from './useRemoveNotification';

/**
 * Одно соединение SSE на вкладку, пока человек в приложении: на каждое событие обновляет бейдж и
 * ленту, а о важных (аккаунт, источники, администрирование) сообщает тостом — если вкладку видно,
 * иначе об этом уже сказал push. Без `EventSource`, пока поток не поднялся или после stop счётчик
 * опрашивается там, где смонтирован колокольчик (в читалке его нет; лента не опрашивается).
 * После повторного открытия данные перезапрашиваются, чтобы пропущенное не потерялось.
 * Поток, закрытый ответом не 200 (502 на деплое), `EventSource` сам не
 * поднимает — переподключаемся с растущей паузой. Управляющий stop запрещает оба механизма
 * восстановления до конца этого эффекта (перезагрузка или новый вход).
 */
function useNotificationsStream() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: removeNotification } = useRemoveNotification();

  const refresh = useEffectEvent(() =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY }),
    ]),
  );

  const toast = useEffectEvent((item: NotificationItem) => {
    if (!hasNotificationToast(item.category)) return;
    if (
      document.visibilityState !== 'visible' &&
      !Toasts.getSnapshot().some((entry) => entry.id === `notification-${item.id}`)
    )
      return;
    showNotificationToast({
      item,
      t,
      onOpen: () => {
        removeNotification(item.id);
        void navigate(getNotificationTargetPath(item));
      },
    });
  });

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;

    let source: EventSource | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = STREAM_RECONNECT_BASE_MS;
    let hasOpened = false;
    let stopped = false;
    let detachSource: (() => void) | undefined;

    const connect = () => {
      if (stopped) return;
      reconnectTimer = undefined;
      detachSource?.();
      const current = new EventSource(NOTIFICATIONS_STREAM_URL);
      source = current;
      const isCurrent = () => !stopped && source === current;

      current.onopen = () => {
        if (!isCurrent()) return;
        setStreamConnected(true);
        reconnectDelay = STREAM_RECONNECT_BASE_MS;
        // Первое открытие идёт следом за обычными запросами страницы, догонять нечего.
        if (hasOpened) void refresh();
        hasOpened = true;
      };
      current.onerror = () => {
        if (!isCurrent()) return;
        setStreamConnected(false);
        // Обрыв сети `EventSource` переподключает сам, а после CLOSED — уже нет.
        if (current.readyState !== EventSource.CLOSED) return;
        if (reconnectTimer !== undefined) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, STREAM_RECONNECT_MAX_MS);
      };
      current.onmessage = (message: MessageEvent<string>) => {
        if (!isCurrent()) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(message.data);
        } catch {
          return;
        }
        const result = NotificationStreamEventSchema.safeParse(parsed);
        if (!result.success) return;

        void refresh();
        const event = result.data;
        if (event.type === NOTIFICATION_STREAM_EVENT.REMOVED) {
          if (event.id) removeNotificationToast(event.id);
          else void reconcileNotificationToasts();
        } else toast(event.notification);
      };

      const stop = (message: MessageEvent<string>) => {
        if (!isCurrent()) return;
        try {
          if (!NotificationStreamStopSchema.safeParse(JSON.parse(message.data)).success) return;
        } catch {
          return;
        }
        // Сначала запрет: уже поставленные callbacks и таймер не должны оживить поток.
        stopped = true;
        clearTimeout(reconnectTimer);
        detachSource?.();
        detachSource = undefined;
        source = undefined;
        setStreamConnected(false);
      };
      current.addEventListener(NOTIFICATION_STREAM_CONTROL_EVENT.STOP, stop);
      detachSource = () => {
        current.onopen = null;
        current.onerror = null;
        current.onmessage = null;
        current.removeEventListener(NOTIFICATION_STREAM_CONTROL_EVENT.STOP, stop);
        current.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      detachSource?.();
      source = undefined;
      setStreamConnected(false);
    };
  }, []);
}

export default useNotificationsStream;
