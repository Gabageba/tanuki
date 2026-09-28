import { useEffect } from 'react';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { apiFetch } from '@/shared/api/client';

const TICK_MS = 1000;
const MINUTE_MS = 60 * 1000;
/** Без скролла, кликов и клавиш дольше этого читатель считается отошедшим. */
const IDLE_AFTER_MS = 60 * 1000;
const FLUSH_INTERVAL_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'] as const;

/** Начало минуты в серверном формате — `YYYY-MM-DDTHH:MM:00Z`. */
const toMinuteKey = (time: number) =>
  `${new Date(Math.floor(time / MINUTE_MS) * MINUTE_MS).toISOString().slice(0, 19)}Z`;

/**
 * Считает активное время в читалке: секунда идёт, пока вкладка видна и читатель недавно что-то
 * делал. Секунды копятся по минутам и уходят на сервер раз в минуту, а также когда читалку
 * прячут, закрывают или покидают.
 */
function useTrackReadingTime() {
  const { data: user } = useCurrentUser();
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const pending = new Map<string, number>();
    let lastActivityAt = Date.now();

    const markActivity = () => {
      lastActivityAt = Date.now();
    };

    const tick = () => {
      const now = Date.now();
      if (document.visibilityState !== 'visible' || now - lastActivityAt > IDLE_AFTER_MS) return;
      const key = toMinuteKey(now);
      pending.set(key, Math.min(60, (pending.get(key) ?? 0) + TICK_MS / 1000));
    };

    // Запрос уходит синхронно и с keepalive — его можно слать и из pagehide.
    const flush = () => {
      if (pending.size === 0) return;
      const minutes = [...pending].map(([minute, seconds]) => ({ minute, seconds }));
      pending.clear();
      apiFetch<void>('/reading-activity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ minutes }),
        keepalive: true,
      }).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
      else markActivity();
    };

    const tickTimer = window.setInterval(tick, TICK_MS);
    const flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true, capture: true }),
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flush);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(flushTimer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity, { capture: true }),
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [isLoggedIn]);
}

export default useTrackReadingTime;
