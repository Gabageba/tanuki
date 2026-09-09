import {
  SOURCE_STATUS,
  type EnumLiteralsOf,
  type SourceStatus,
  type SourceStatusReason,
} from '@tanuki/contracts';

/** Состояния circuit breaker'а источника — см. SourceHealthService. */
export const BREAKER_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'halfOpen',
} as const;
export type BreakerState = EnumLiteralsOf<typeof BREAKER_STATE>;

export type SourceState = {
  state: BreakerState;
  consecutiveFailures: number;
  openedAt: number;
  probeInFlight: boolean;
};

export type SourceQueue = {
  active: number;
  queue: Array<() => void>;
};

/** Персистентный статус источника — см. SourceStatusService. */
export type SourceStatusEntry = {
  status: SourceStatus;
  /** null только у источника, которого не касались ни автоматика, ни человек. */
  reason: SourceStatusReason | null;
  /** Сколько ночных прогонов подряд упало. */
  failedProbeStreak: number;
  /** Сколько живых запросов подряд прошло успешно — только в памяти, в базу не уходит. */
  successStreak: number;
  lastError: string | null;
  checkedAt: Date | null;
  statusChangedAt: Date | null;
};

/** Источник, о котором ничего не известно, считается рабочим. */
export const defaultStatusEntry = (): SourceStatusEntry => {
  return {
    status: SOURCE_STATUS.OK,
    reason: null,
    failedProbeStreak: 0,
    successStreak: 0,
    lastError: null,
    checkedAt: null,
    statusChangedAt: null,
  };
};
