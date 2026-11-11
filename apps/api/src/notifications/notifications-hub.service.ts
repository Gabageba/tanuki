import { Injectable } from '@nestjs/common';
import { interval, map, merge, Observable, Subject } from 'rxjs';
import {
  NOTIFICATION_STREAM_CONTROL_EVENT,
  NOTIFICATION_STREAM_STOP_REASON,
  type NotificationStreamEvent,
  type NotificationStreamStop,
} from '@tanuki/contracts';
import { MAX_STREAMS_PER_USER, STREAM_HEARTBEAT_EVENT, STREAM_HEARTBEAT_MS } from './models';

/** Сообщение SSE в форме, которую понимает `@Sse()` Nest. */
export type StreamMessage = { type?: string; data: string };

type UserStream = { events: Subject<NotificationStreamEvent>; stop: () => void };

/**
 * Рассылка событий открытым вкладкам: по одному потоку SSE на вкладку, события — по userId.
 * Хаб живёт в памяти процесса, поэтому работает при одной реплике API; при нескольких его
 * заменит pub/sub в Valkey (docs/plans/notifications.md, «Открытые вопросы»).
 */
@Injectable()
export class NotificationsHubService {
  private readonly streams = new Map<string, Set<UserStream>>();

  publish(userId: string, event: NotificationStreamEvent): void {
    for (const stream of this.streams.get(userId) ?? []) {
      stream.events.next(event);
    }
  }

  /**
   * Новый поток пользователя. Сверх лимита самый старый получает stop перед завершением:
   * клиент закрывает EventSource без повторов и возвращается к запасному опросу счётчика.
   */
  open(userId: string): Observable<StreamMessage> {
    return new Observable<StreamMessage>((subscriber) => {
      const events = new Subject<NotificationStreamEvent>();
      const stream: UserStream = {
        events,
        stop: () => {
          const payload: NotificationStreamStop = {
            reason: NOTIFICATION_STREAM_STOP_REASON.CONNECTION_LIMIT,
          };
          subscriber.next({
            type: NOTIFICATION_STREAM_CONTROL_EVENT.STOP,
            data: JSON.stringify(payload),
          });
          subscriber.complete();
        },
      };

      const subscription = merge(
        events.pipe(map((event): StreamMessage => ({ data: JSON.stringify(event) }))),
        // Nest omits an empty data string, and EventSource ignores a frame without data.
        interval(STREAM_HEARTBEAT_MS).pipe(
          map((): StreamMessage => ({ type: STREAM_HEARTBEAT_EVENT, data: '{}' })),
        ),
      ).subscribe(subscriber);

      const existing = this.streams.get(userId) ?? new Set<UserStream>();
      // Очистка уже зарегистрирована, если обработчик stop синхронно откроет новый поток.
      subscriber.add(() => {
        subscription.unsubscribe();
        events.complete();
        existing.delete(stream);
        if (existing.size === 0 && this.streams.get(userId) === existing) {
          this.streams.delete(userId);
        }
      });
      existing.add(stream);
      this.streams.set(userId, existing);
      while (existing.size > MAX_STREAMS_PER_USER) {
        const oldest = existing.values().next().value;
        if (!oldest) break;
        // Убираем до callback: новые подключения не должны повторно вытеснять этот поток.
        existing.delete(oldest);
        oldest.stop();
      }
    });
  }

  /** Сколько потоков открыто у пользователя. */
  countStreams(userId: string): number {
    return this.streams.get(userId)?.size ?? 0;
  }
}
