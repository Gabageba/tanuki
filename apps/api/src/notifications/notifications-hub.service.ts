import { Injectable } from '@nestjs/common';
import { interval, map, merge, Observable, Subject } from 'rxjs';
import type { NotificationStreamEvent } from '@tanuki/contracts';
import { MAX_STREAMS_PER_USER, STREAM_HEARTBEAT_EVENT, STREAM_HEARTBEAT_MS } from './models';

/** Сообщение SSE в форме, которую понимает `@Sse()` Nest. */
export type StreamMessage = { type?: string; data: string };

type UserStream = { events: Subject<NotificationStreamEvent>; close: () => void };

/**
 * Рассылка событий открытым вкладкам: по одному потоку SSE на вкладку, события — по userId.
 * Хаб живёт в памяти процесса, поэтому работает при одной реплике API; при нескольких его
 * заменит pub/sub в Valkey (docs/plans/notifications.md, «Открытые вопросы»).
 */
@Injectable()
export class NotificationsHubService {
  private readonly streams = new Map<string, UserStream[]>();

  publish(userId: string, event: NotificationStreamEvent): void {
    for (const stream of this.streams.get(userId) ?? []) {
      stream.events.next(event);
    }
  }

  /**
   * Новый поток пользователя. Если их уже `MAX_STREAMS_PER_USER`, самый старый закрывается —
   * остальные вкладки продолжают работать, а закрытая вернётся на запасный опрос счётчика.
   */
  open(userId: string): Observable<StreamMessage> {
    return new Observable<StreamMessage>((subscriber) => {
      const events = new Subject<NotificationStreamEvent>();
      const stream: UserStream = { events, close: () => subscriber.complete() };

      const existing = this.streams.get(userId) ?? [];
      while (existing.length >= MAX_STREAMS_PER_USER) {
        existing.shift()?.close();
      }
      existing.push(stream);
      this.streams.set(userId, existing);

      const subscription = merge(
        events.pipe(map((event): StreamMessage => ({ data: JSON.stringify(event) }))),
        interval(STREAM_HEARTBEAT_MS).pipe(
          map((): StreamMessage => ({ type: STREAM_HEARTBEAT_EVENT, data: '' })),
        ),
      ).subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        events.complete();
        const left = (this.streams.get(userId) ?? []).filter((item) => item !== stream);
        if (left.length === 0) this.streams.delete(userId);
        else this.streams.set(userId, left);
      };
    });
  }

  /** Сколько потоков открыто у пользователя. */
  countStreams(userId: string): number {
    return this.streams.get(userId)?.length ?? 0;
  }
}
