import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Состояния circuit breaker'а источника — см. SourceHealthService. */
export const BREAKER_STATE = {
  closed: 'closed',
  open: 'open',
  halfOpen: 'half-open',
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
