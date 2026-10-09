import { describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_STREAM_EVENT } from '@tanuki/contracts';
import { MAX_STREAMS_PER_USER } from './models';
import { NotificationsHubService } from './notifications-hub.service';

describe('NotificationsHubService', () => {
  it('рассылает событие всем потокам пользователя и только им', () => {
    const hub = new NotificationsHubService();
    const mine = vi.fn();
    const other = vi.fn();
    hub.open('me').subscribe(mine);
    hub.open('other').subscribe(other);

    hub.publish('me', { type: NOTIFICATION_STREAM_EVENT.REMOVED });

    expect(mine).toHaveBeenCalledWith({ data: JSON.stringify({ type: 'removed' }) });
    expect(other).not.toHaveBeenCalled();
  });

  it('закрытый поток вычёркивается из хаба', () => {
    const hub = new NotificationsHubService();
    const subscription = hub.open('me').subscribe();
    expect(hub.countStreams('me')).toBe(1);

    subscription.unsubscribe();

    expect(hub.countStreams('me')).toBe(0);
  });

  it('шестой поток вытесняет самый старый', () => {
    const hub = new NotificationsHubService();
    const completed = Array.from({ length: MAX_STREAMS_PER_USER + 1 }, () => vi.fn());
    completed.forEach((onComplete) => hub.open('me').subscribe({ complete: onComplete }));

    expect(hub.countStreams('me')).toBe(MAX_STREAMS_PER_USER);
    expect(completed[0]).toHaveBeenCalledTimes(1);
    expect(completed[1]).not.toHaveBeenCalled();
  });

  it('шлёт пульс, пока поток открыт', () => {
    vi.useFakeTimers();
    try {
      const hub = new NotificationsHubService();
      const received = vi.fn();
      const subscription = hub.open('me').subscribe(received);

      vi.advanceTimersByTime(25_000);
      subscription.unsubscribe();

      expect(received).toHaveBeenCalledWith({ type: 'ping', data: '' });
    } finally {
      vi.useRealTimers();
    }
  });
});
