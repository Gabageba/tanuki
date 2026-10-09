import { useEffect, useEffectEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  NOTIFICATION_STREAM_EVENT,
  NotificationStreamEventSchema,
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
import { showNotificationToast } from '../toasts';
import useRemoveNotification from './useRemoveNotification';

/**
 * Одно соединение SSE на вкладку, пока человек в приложении: на каждое событие обновляет бейдж и
 * ленту, а о важных (аккаунт, источники, администрирование) сообщает тостом — если вкладку видно,
 * иначе об этом уже сказал push. Без `EventSource` или пока поток не поднялся счётчик опрашивается
 * (см. `useUnreadNotificationsCount`); при каждом (пере)подключении всё перезапрашивается, чтобы
 * пропущенное не потерялось. Поток, закрытый ответом не 200 (502 на деплое), `EventSource` сам не
 * поднимает — переподключаемся с растущей паузой.
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
    if (document.visibilityState !== 'visible' || !hasNotificationToast(item.category)) return;
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

    const connect = () => {
      const current = new EventSource(NOTIFICATIONS_STREAM_URL);
      source = current;

      current.onopen = () => {
        setStreamConnected(true);
        reconnectDelay = STREAM_RECONNECT_BASE_MS;
        // Первое открытие идёт следом за обычными запросами страницы, догонять нечего.
        if (hasOpened) void refresh();
        hasOpened = true;
      };
      current.onerror = () => {
        setStreamConnected(false);
        // Обрыв сети `EventSource` переподключает сам, а после CLOSED — уже нет.
        if (current.readyState !== EventSource.CLOSED) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, STREAM_RECONNECT_MAX_MS);
      };
      current.onmessage = (message: MessageEvent<string>) => {
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
        if (event.type !== NOTIFICATION_STREAM_EVENT.REMOVED) toast(event.notification);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      source?.close();
      setStreamConnected(false);
    };
  }, []);
}

export default useNotificationsStream;
