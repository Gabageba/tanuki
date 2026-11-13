import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Subscription } from 'rxjs';
import {
  NOTIFICATION_STREAM_CONTROL_EVENT,
  NOTIFICATION_STREAM_EVENT,
  NOTIFICATION_STREAM_STOP_REASON,
  NotificationStreamStopSchema,
} from '@tanuki/contracts';
import { MAX_STREAMS_PER_USER, STREAM_HEARTBEAT_MS } from './models';
import { NotificationsHubService } from './notifications-hub.service';

const STOP = {
  type: NOTIFICATION_STREAM_CONTROL_EVENT.STOP,
  data: JSON.stringify({ reason: NOTIFICATION_STREAM_STOP_REASON.CONNECTION_LIMIT }),
};
const REMOVED = { type: NOTIFICATION_STREAM_EVENT.REMOVED };

describe('NotificationsHubService', () => {
  const subscriptions: Subscription[] = [];
  const open = (
    hub: NotificationsHubService,
    userId = 'me',
    next = vi.fn(),
    complete = vi.fn(),
  ) => {
    const subscription = hub.open(userId).subscribe({ next, complete });
    subscriptions.push(subscription);
    return subscription;
  };

  afterEach(() => {
    subscriptions.splice(0).forEach((subscription) => subscription.unsubscribe());
    vi.useRealTimers();
  });

  it('рассылает событие всем потокам пользователя и только им', () => {
    const hub = new NotificationsHubService();
    const mine = vi.fn();
    const other = vi.fn();
    open(hub, 'me', mine);
    open(hub, 'other', other);
    hub.publish('me', REMOVED);
    expect(mine).toHaveBeenCalledWith({ data: JSON.stringify(REMOVED) });
    expect(other).not.toHaveBeenCalled();
  });

  it('обычное закрытие не отправляет stop и освобождает место', () => {
    const hub = new NotificationsHubService();
    const next = vi.fn();
    const subscription = open(hub, 'me', next);
    expect(hub.countStreams('me')).toBe(1);
    subscription.unsubscribe();
    expect(hub.countStreams('me')).toBe(0);
    expect(next).not.toHaveBeenCalled();
    for (let index = 0; index < MAX_STREAMS_PER_USER; index++) open(hub);
    expect(hub.countStreams('me')).toBe(MAX_STREAMS_PER_USER);
  });

  it.each([1, 5, 6, 7, 50])(
    '%i подключений оставляют последние пять без потери записей',
    (count) => {
      const hub = new NotificationsHubService();
      const other = vi.fn();
      const otherComplete = vi.fn();
      open(hub, 'other', other, otherComplete);
      const received = Array.from({ length: count }, () => vi.fn());
      const completed = received.map(() => vi.fn());
      received.forEach((next, index) => {
        open(hub, 'me', next, completed[index]);
        expect(hub.countStreams('me')).toBe(Math.min(index + 1, MAX_STREAMS_PER_USER));
      });
      hub.publish('me', REMOVED);
      received.forEach((next, index) => {
        const evicted = index < count - MAX_STREAMS_PER_USER;
        expect(next.mock.calls).toEqual([[evicted ? STOP : { data: JSON.stringify(REMOVED) }]]);
        expect(completed[index]).toHaveBeenCalledTimes(evicted ? 1 : 0);
      });
      expect(other).not.toHaveBeenCalled();
      expect(otherComplete).not.toHaveBeenCalled();
      expect(hub.countStreams('other')).toBe(1);
    },
  );

  it('stop с непустым валидным payload приходит перед complete, после нет событий и heartbeat', () => {
    vi.useFakeTimers();
    const hub = new NotificationsHubService();
    const order: unknown[] = [];
    const first = hub.open('me').subscribe({
      next: (message) => order.push(message),
      complete: () => order.push('complete'),
    });
    subscriptions.push(first);
    for (let index = 0; index < MAX_STREAMS_PER_USER; index++) open(hub);
    expect(order).toEqual([STOP, 'complete']);
    expect(NotificationStreamStopSchema.parse(JSON.parse(STOP.data))).toEqual({
      reason: NOTIFICATION_STREAM_STOP_REASON.CONNECTION_LIMIT,
    });
    expect(first.closed).toBe(true);
    expect(vi.getTimerCount()).toBe(MAX_STREAMS_PER_USER);
    hub.publish('me', REMOVED);
    vi.advanceTimersByTime(STREAM_HEARTBEAT_MS * 2);
    expect(order).toEqual([STOP, 'complete']);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('порядок вытеснения не зависит от активности, закрытый средний поток не мешает', () => {
    const hub = new NotificationsHubService();
    const received = Array.from({ length: MAX_STREAMS_PER_USER + 1 }, () => vi.fn());
    const opened = received.slice(0, MAX_STREAMS_PER_USER).map((next) => open(hub, 'me', next));
    hub.publish('me', REMOVED);
    opened[2]!.unsubscribe();
    open(hub, 'me', received[5]);
    expect(received[0]).not.toHaveBeenCalledWith(STOP);
    open(hub);
    expect(received[0]).toHaveBeenLastCalledWith(STOP);
    expect(received[1]).not.toHaveBeenCalledWith(STOP);
    expect(hub.countStreams('me')).toBe(MAX_STREAMS_PER_USER);
  });

  it('повторный вход в open из обработчиков вытеснения не теряет новые потоки', () => {
    const hub = new NotificationsHubService();
    const nested = vi.fn();
    const received = vi.fn();
    const first = hub.open('me').subscribe({
      next: () => open(hub, 'me', nested),
      complete: () => open(hub, 'me', nested),
    });
    subscriptions.push(first);
    for (let index = 0; index < MAX_STREAMS_PER_USER; index++) open(hub, 'me', received);
    expect(hub.countStreams('me')).toBe(MAX_STREAMS_PER_USER);
    hub.publish('me', REMOVED);
    expect(nested).toHaveBeenCalledTimes(2);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    expect(hub.countStreams('me')).toBe(0);
  });

  it('шлёт пульс, пока поток открыт', () => {
    vi.useFakeTimers();
    const hub = new NotificationsHubService();
    const received = vi.fn();
    const subscription = open(hub, 'me', received);
    vi.advanceTimersByTime(STREAM_HEARTBEAT_MS);
    subscription.unsubscribe();
    expect(received).toHaveBeenCalledWith({ type: 'ping', data: '{}' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
