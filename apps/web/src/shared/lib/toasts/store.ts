import { FEEDBACK_TONE, getToneToastDuration, type FeedbackTone } from '../feedback';
import {
  MAX_TOASTS,
  READ_ERROR_SUPPRESSION_MS,
  TOAST_CLOSE_REASON,
  TOAST_KIND,
  TOAST_PAUSE,
  type ToastClock,
  type ToastCloseReason,
  type ToastEntry,
  type ToastInput,
  type ToastPause,
} from './models';

const CLOCK: ToastClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (timer) => clearTimeout(timer),
};

const getPriority = (entry: ToastEntry) => {
  switch (entry.kind) {
    case TOAST_KIND.UNDO:
    case TOAST_KIND.SECURITY:
      return 0;
    case TOAST_KIND.MESSAGE:
      return 1;
    case TOAST_KIND.PWA:
      return 2;
  }
};

const getDuration = (kind: ToastEntry['kind'], tone: FeedbackTone) => {
  switch (kind) {
    case TOAST_KIND.PWA:
      return null;
    case TOAST_KIND.UNDO:
    case TOAST_KIND.SECURITY:
      return 10_000;
    case TOAST_KIND.MESSAGE:
      return getToneToastDuration(tone);
  }
};

/** Один владелец очереди и времени; UI только подтверждает фокус, наведение и видимость вкладки. */
export const createToastStore = (clock: ToastClock = CLOCK) => {
  let entries: ToastEntry[] = [];
  let sequence = 0;
  let revision = 0;
  let ownerVersion = 0;
  let reader = false;
  let hidden = false;
  let owner: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTime = clock.now();
  const listeners = new Set<() => void>();
  const suppressed = new Map<string, number>();

  const eligible = (entry: ToastEntry) => !reader || entry.readerAllowed !== false;
  const running = (entry: ToastEntry) => entry.visible && !hidden && entry.pauses.size === 0;
  const accountTime = () => {
    const now = clock.now();
    const elapsed = now - lastTime;
    lastTime = now;
    if (timer !== undefined) clock.cancel(timer);
    timer = undefined;
    entries = entries.map((entry) =>
      running(entry) && entry.remaining !== null
        ? { ...entry, remaining: Math.max(0, entry.remaining - elapsed) }
        : entry,
    );
    entries = entries.filter((entry) => entry.remaining !== 0);
    for (const [key, until] of suppressed) if (until <= now) suppressed.delete(key);
  };

  const publish = () => {
    const available = entries.filter(eligible);
    // Фокус остаётся на экране; остальные места занимает нижняя, самая новая часть стека.
    const focused = available.filter(
      (entry) => entry.visible && entry.pauses.has(TOAST_PAUSE.FOCUS),
    );
    const selected = new Set(focused.map((entry) => entry.id));
    const stacked = available.filter(
      (entry) => entry.presented && entry.kind !== TOAST_KIND.PWA && !selected.has(entry.id),
    );
    const slots = MAX_TOASTS - selected.size;
    if (slots > 0) stacked.slice(-slots).forEach((entry) => selected.add(entry.id));

    // События после читалки впервые попадают в стек по свободным местам, а не всей пачкой.
    const waiting = available
      .filter((entry) => !entry.presented && entry.kind !== TOAST_KIND.PWA)
      .sort((a, b) => getPriority(a) - getPriority(b) || a.sequence - b.sequence);
    waiting.slice(0, MAX_TOASTS - selected.size).forEach((entry) => selected.add(entry.id));
    available
      .filter((entry) => entry.kind === TOAST_KIND.PWA && !selected.has(entry.id))
      .slice(0, MAX_TOASTS - selected.size)
      .forEach((entry) => selected.add(entry.id));

    entries = entries.map((entry) => {
      const visible = selected.has(entry.id);
      return {
        ...entry,
        visible,
        presented: entry.presented || visible,
        // У скрытой карточки больше нет наведения, фокуса или DOM-наблюдателя видимости.
        pauses: entry.visible && !visible ? new Set<ToastPause>() : entry.pauses,
      };
    });
    const durations = entries.flatMap((entry) =>
      running(entry) && entry.remaining !== null ? [entry.remaining] : [],
    );
    if (durations.length) {
      timer = clock.schedule(
        () => {
          accountTime();
          publish();
        },
        Math.min(...durations),
      );
    }
    listeners.forEach((listener) => listener());
  };

  const close = (id: string, reason: ToastCloseReason = TOAST_CLOSE_REASON.OBSOLETE) => {
    accountTime();
    const entry = entries.find((item) => item.id === id);
    entries = entries.filter((item) => item.id !== id);
    publish();
    if (reason === TOAST_CLOSE_REASON.DISMISS) entry?.onDismiss?.();
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => entries,
    getOwner: () => owner,
    getOwnerVersion: () => ownerVersion,
    show: (input: ToastInput) => {
      accountTime();
      const existing = entries.find(
        (entry) =>
          (input.id !== undefined && entry.id === input.id) ||
          (input.key !== undefined && entry.key === input.key),
      );
      if (existing) {
        if (input.key && input.suppressAfterClose)
          suppressed.set(input.key, clock.now() + READ_ERROR_SUPPRESSION_MS);
        entries = entries.map((entry) =>
          entry.id === existing.id
            ? { ...entry, ...input, id: existing.id, revision: ++revision }
            : entry,
        );
        publish();
        return existing.id;
      }
      const id = input.id ?? `toast-${++sequence}`;
      if (input.key && suppressed.has(input.key)) {
        publish();
        return id;
      }
      const tone = input.tone ?? FEEDBACK_TONE.NEUTRAL;
      const kind = input.kind ?? TOAST_KIND.MESSAGE;
      const entry: ToastEntry = {
        ...input,
        id,
        tone,
        kind,
        sequence: ++sequence,
        revision: ++revision,
        owner,
        visible: false,
        presented: kind !== TOAST_KIND.PWA && (!reader || input.readerAllowed !== false),
        pauses: new Set(),
        remaining: getDuration(kind, tone),
      };
      if (input.key && input.suppressAfterClose)
        suppressed.set(input.key, clock.now() + READ_ERROR_SUPPRESSION_MS);
      entries = [...entries, entry];
      publish();
      return id;
    },
    close,
    act: (id: string, action: () => void) => {
      if (!entries.some((entry) => entry.id === id && entry.visible)) return;
      close(id, TOAST_CLOSE_REASON.ACTION);
      action();
    },
    pause: (id: string, reason: ToastPause, paused: boolean) => {
      accountTime();
      entries = entries.map((entry) => {
        if (entry.id !== id) return entry;
        const pauses = new Set(entry.pauses);
        if (paused) pauses.add(reason);
        else pauses.delete(reason);
        return { ...entry, pauses };
      });
      publish();
    },
    setHidden: (value: boolean) => {
      if (hidden === value) return;
      accountTime();
      hidden = value;
      publish();
    },
    setReader: (value: boolean) => {
      if (reader === value) return;
      accountTime();
      reader = value;
      publish();
    },
    setOwner: (value: string | null) => {
      if (owner === value) return;
      accountTime();
      owner = value;
      ownerVersion++;
      entries = entries.filter((entry) => entry.global);
      suppressed.clear();
      publish();
    },
    removeWhere: (predicate: (entry: ToastEntry) => boolean) => {
      accountTime();
      entries = entries.filter((entry) => !predicate(entry));
      publish();
    },
    clearSuppression: () => suppressed.clear(),
    reset: () => {
      accountTime();
      entries = [];
      suppressed.clear();
      publish();
    },
  };
};

export const Toasts = createToastStore();
