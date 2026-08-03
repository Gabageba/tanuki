import { Inject, Injectable } from '@nestjs/common';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';

type BreakerState = 'closed' | 'open' | 'half-open';

interface SourceState {
  state: BreakerState;
  consecutiveFailures: number;
  openedAt: number;
  probeInFlight: boolean;
}

function initialState(): SourceState {
  return { state: 'closed', consecutiveFailures: 0, openedAt: 0, probeInFlight: false };
}

/**
 * Circuit breaker на источник: docs/03-parsers.md — "5 ошибок подряд → degraded на 10 минут".
 * Состояние живёт в памяти процесса (один инстанс api), не в Valkey — это допустимо, так как
 * это сигнал "не долби мёртвый источник", а не персистентные данные.
 */
@Injectable()
export class SourceHealthService {
  private readonly sources = new Map<string, SourceState>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  private stateOf(sourceId: string): SourceState {
    let entry = this.sources.get(sourceId);
    if (!entry) {
      entry = initialState();
      this.sources.set(sourceId, entry);
    }
    return entry;
  }

  /** true, если запрос можно попробовать выполнить прямо сейчас. */
  canAttempt(sourceId: string): boolean {
    const entry = this.stateOf(sourceId);
    if (entry.state !== 'open') {
      return true;
    }

    const cooldownElapsed = Date.now() - entry.openedAt >= this.env.SOURCE_BREAKER_RESET_MS;
    if (!cooldownElapsed) {
      return false;
    }

    if (entry.probeInFlight) {
      return false;
    }

    entry.state = 'half-open';
    entry.probeInFlight = true;
    return true;
  }

  recordSuccess(sourceId: string): void {
    const entry = this.stateOf(sourceId);
    entry.state = 'closed';
    entry.consecutiveFailures = 0;
    entry.probeInFlight = false;
  }

  recordFailure(sourceId: string): void {
    const entry = this.stateOf(sourceId);
    entry.probeInFlight = false;

    if (entry.state === 'half-open') {
      entry.state = 'open';
      entry.openedAt = Date.now();
      return;
    }

    entry.consecutiveFailures += 1;
    if (entry.consecutiveFailures >= this.env.SOURCE_BREAKER_FAILURE_THRESHOLD) {
      entry.state = 'open';
      entry.openedAt = Date.now();
    }
  }

  /**
   * Отпускает "пробный" слот half-open, не трогая счётчик ошибок — для случаев вроде
   * переполнения локальной очереди ConcurrencyLimiterService, где источник вообще не был
   * опрошен, так что это не сигнал ни успеха, ни неудачи источника.
   */
  releaseProbe(sourceId: string): void {
    this.stateOf(sourceId).probeInFlight = false;
  }

  getStatus(sourceId: string): 'ok' | 'degraded' {
    return this.stateOf(sourceId).state === 'closed' ? 'ok' : 'degraded';
  }

  getRetryAfterSeconds(sourceId: string): number {
    const entry = this.stateOf(sourceId);
    if (entry.state !== 'open') {
      return 0;
    }
    const remainingMs = entry.openedAt + this.env.SOURCE_BREAKER_RESET_MS - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}
