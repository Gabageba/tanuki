import { Inject, Injectable } from '@nestjs/common';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { BREAKER_STATE, type SourceState } from './models';

const initialState = (): SourceState => {
  return { state: BREAKER_STATE.CLOSED, consecutiveFailures: 0, openedAt: 0, probeInFlight: false };
};

/**
 * Circuit breaker на источник: 5 ошибок подряд → запросы к источнику не пропускаются несколько
 * минут, потом идёт одна пробная. Состояние живёт в памяти процесса (один инстанс api), не в
 * Valkey — это допустимо, так как это сигнал "не долби мёртвый источник", а не персистентные
 * данные.
 *
 * Статуса источника (ok/degraded/down) тут больше нет — им владеет SourceStatusService. Breaker
 * только сообщает о факте открытия, а решение, что показать пользователю и надолго ли, принимает
 * тот. Пока эти два понятия были одним, статус самопроизвольно возвращался в ok через окно
 * блокировки, даже если источник продолжал лежать.
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
    if (entry.state === BREAKER_STATE.CLOSED) {
      return true;
    }

    // Half-open пропускает ровно одну пробную и ждёт её исхода. Без этой проверки состояние
    // "не open" читалось бы как "можно всем", и пока пробная висит на мёртвом источнике, туда
    // уходил бы весь параллельный трафик — то самое, ради чего breaker и нужен.
    if (entry.state === BREAKER_STATE.HALF_OPEN) {
      if (entry.probeInFlight) {
        return false;
      }
      entry.probeInFlight = true;
      return true;
    }

    const cooldownElapsed = Date.now() - entry.openedAt >= this.env.SOURCE_BREAKER_RESET_MS;
    if (!cooldownElapsed) {
      return false;
    }

    if (entry.probeInFlight) {
      return false;
    }

    entry.state = BREAKER_STATE.HALF_OPEN;
    entry.probeInFlight = true;
    return true;
  }

  recordSuccess(sourceId: string): void {
    const entry = this.stateOf(sourceId);
    entry.state = BREAKER_STATE.CLOSED;
    entry.consecutiveFailures = 0;
    entry.probeInFlight = false;
  }

  /** Возвращает true, если этой ошибкой breaker открылся, — сигнал сменить статус источника. */
  recordFailure(sourceId: string): boolean {
    const entry = this.stateOf(sourceId);
    entry.probeInFlight = false;

    if (entry.state === BREAKER_STATE.HALF_OPEN) {
      entry.state = BREAKER_STATE.OPEN;
      entry.openedAt = Date.now();
      return true;
    }

    entry.consecutiveFailures += 1;
    if (entry.consecutiveFailures >= this.env.SOURCE_BREAKER_FAILURE_THRESHOLD) {
      entry.state = BREAKER_STATE.OPEN;
      entry.openedAt = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Отпускает "пробный" слот half-open, не трогая счётчик ошибок — для случаев вроде
   * переполнения локальной очереди ConcurrencyLimiterService, где источник вообще не был
   * опрошен, так что это не сигнал ни успеха, ни неудачи источника.
   */
  releaseProbe(sourceId: string): void {
    this.stateOf(sourceId).probeInFlight = false;
  }

  /**
   * Сбрасывает breaker источника в закрытое состояние — используется успешным ночным пробником,
   * чтобы breaker, открытый вечером, не блокировал утренний трафик до истечения своего окна.
   */
  reset(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  getRetryAfterSeconds(sourceId: string): number {
    const entry = this.stateOf(sourceId);
    if (entry.state !== BREAKER_STATE.OPEN) {
      return 0;
    }
    const remainingMs = entry.openedAt + this.env.SOURCE_BREAKER_RESET_MS - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}
