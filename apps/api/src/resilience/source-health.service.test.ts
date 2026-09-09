import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env';
import { SourceHealthService } from './source-health.service';

const SOURCE = 'readmanga_ru';
const RESET_MS = 180_000;

const env = {
  SOURCE_BREAKER_FAILURE_THRESHOLD: 5,
  SOURCE_BREAKER_RESET_MS: RESET_MS,
} as Env;

const failUntilOpen = (service: SourceHealthService): boolean => {
  let opened = false;
  for (let attempt = 0; attempt < env.SOURCE_BREAKER_FAILURE_THRESHOLD; attempt += 1) {
    opened = service.recordFailure(SOURCE);
  }
  return opened;
};

describe('SourceHealthService', () => {
  let service: SourceHealthService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new SourceHealthService(env);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('пропускает запросы, пока ошибок меньше порога', () => {
    for (let attempt = 0; attempt < env.SOURCE_BREAKER_FAILURE_THRESHOLD - 1; attempt += 1) {
      expect(service.recordFailure(SOURCE)).toBe(false);
      expect(service.canAttempt(SOURCE)).toBe(true);
    }
  });

  it('сообщает об открытии ровно один раз — на пороговой ошибке', () => {
    // От этого булева зависит статус источника: сообщи breaker об открытии на каждой ошибке,
    // и SourceStatusService переписывал бы statusChangedAt после каждого неудачного запроса.
    expect(failUntilOpen(service)).toBe(true);
    expect(service.canAttempt(SOURCE)).toBe(false);
  });

  it('после окна блокировки пропускает ровно одну пробную', () => {
    failUntilOpen(service);
    vi.advanceTimersByTime(RESET_MS);

    expect(service.canAttempt(SOURCE)).toBe(true);
    // Вторая параллельная попытка не должна проскочить: сайт ещё не подтвердил, что ожил.
    expect(service.canAttempt(SOURCE)).toBe(false);
  });

  it('закрывается на успешной пробной', () => {
    failUntilOpen(service);
    vi.advanceTimersByTime(RESET_MS);
    service.canAttempt(SOURCE);

    service.recordSuccess(SOURCE);
    expect(service.canAttempt(SOURCE)).toBe(true);
    expect(service.canAttempt(SOURCE)).toBe(true);
  });

  it('снова открывается на упавшей пробной, перезапуская окно', () => {
    failUntilOpen(service);
    vi.advanceTimersByTime(RESET_MS);
    service.canAttempt(SOURCE);

    expect(service.recordFailure(SOURCE)).toBe(true);
    expect(service.canAttempt(SOURCE)).toBe(false);

    vi.advanceTimersByTime(RESET_MS);
    expect(service.canAttempt(SOURCE)).toBe(true);
  });

  it('releaseProbe отпускает пробный слот, не считая это ни успехом, ни ошибкой', () => {
    failUntilOpen(service);
    vi.advanceTimersByTime(RESET_MS);
    service.canAttempt(SOURCE);

    // Случай переполненной локальной очереди: источник вообще не опрашивали, поэтому слот
    // возвращается, а breaker остаётся открытым.
    service.releaseProbe(SOURCE);
    expect(service.canAttempt(SOURCE)).toBe(true);
    expect(service.getRetryAfterSeconds(SOURCE)).toBe(0);
  });

  it('отдаёт остаток окна в Retry-After', () => {
    failUntilOpen(service);
    vi.advanceTimersByTime(RESET_MS / 2);

    expect(service.getRetryAfterSeconds(SOURCE)).toBe(RESET_MS / 2 / 1000);
  });

  it('сбрасывается извне — например, успешным ночным пробником', () => {
    failUntilOpen(service);
    service.reset(SOURCE);

    expect(service.canAttempt(SOURCE)).toBe(true);
  });
});
