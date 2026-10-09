import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SOURCE_STATUS, SOURCE_STATUS_REASON } from '@tanuki/contracts';
import type { Env } from '../config/env';
import type { DatabaseService } from '../database/database.service';
import type { SourceStatusNotifierService } from '../notifications/source-status-notifier.service';
import { SourceStatusService } from './source-status.service';

const SOURCE = 'readmanga_ru';

const env = {
  SOURCE_RECOVERY_SUCCESS_THRESHOLD: 5,
  SOURCE_PROBE_FAILURE_THRESHOLD: 3,
} as Env;

/**
 * Сервис держит состояние в памяти, а базу использует только чтобы пережить рестарт, поэтому
 * подделывается ровно withFallback — как в TitleLinksService: он всегда отдаёт запасное
 * значение, то есть ведёт себя как при мёртвом Postgres. Это заодно проверяет, что без базы
 * логика статусов работает целиком.
 */
const databaseStub = {
  withFallback: <T>(_operation: () => Promise<T>, fallback: T) => Promise.resolve(fallback),
} as unknown as DatabaseService;

describe('SourceStatusService', () => {
  let service: SourceStatusService;
  const onStatusChanged = vi.fn();

  beforeEach(() => {
    onStatusChanged.mockReset();
    service = new SourceStatusService(env, databaseStub, {
      onStatusChanged,
    } as unknown as SourceStatusNotifierService);
  });

  it('сообщает уведомлениям только о смене статуса', () => {
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'boom');
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'boom again');

    expect(onStatusChanged).toHaveBeenCalledTimes(1);
    expect(onStatusChanged).toHaveBeenCalledWith(
      SOURCE,
      SOURCE_STATUS.OK,
      SOURCE_STATUS.DEGRADED,
      SOURCE_STATUS_REASON.REQUEST_FAILURES,
    );
  });

  it('считает источник рабочим, пока о нём ничего не известно', () => {
    const entry = service.get(SOURCE);
    expect(entry.status).toBe(SOURCE_STATUS.OK);
    expect(entry.reason).toBeNull();
    expect(entry.statusChangedAt).toBeNull();
  });

  it('делает источник нестабильным, когда открылся breaker', () => {
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'connect ETIMEDOUT');

    const entry = service.get(SOURCE);
    expect(entry.status).toBe(SOURCE_STATUS.DEGRADED);
    expect(entry.reason).toBe(SOURCE_STATUS_REASON.REQUEST_FAILURES);
    expect(entry.lastError).toBe('connect ETIMEDOUT');
  });

  it('не снимает нестабильность сама собой — только серией успехов', () => {
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'boom');

    // Ровно в этом и смысл перехода на липкий статус: раньше он возвращался в ok через окно
    // breaker'а, даже если источник продолжал лежать.
    for (let attempt = 0; attempt < env.SOURCE_RECOVERY_SUCCESS_THRESHOLD - 1; attempt += 1) {
      service.recordSuccess(SOURCE);
      expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DEGRADED);
    }

    service.recordSuccess(SOURCE);
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.OK);
    expect(service.get(SOURCE).reason).toBe(SOURCE_STATUS_REASON.RECOVERED);
    expect(service.get(SOURCE).lastError).toBeNull();
  });

  it('обнуляет серию успехов на новой ошибке', () => {
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'boom');
    service.recordSuccess(SOURCE);
    service.recordSuccess(SOURCE);
    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'boom again');

    for (let attempt = 0; attempt < env.SOURCE_RECOVERY_SUCCESS_THRESHOLD - 1; attempt += 1) {
      service.recordSuccess(SOURCE);
    }
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DEGRADED);
  });

  it('делает источник неработающим только после нескольких упавших ночей подряд', () => {
    service.applyProbeResult(SOURCE, 'getList вернул пустой каталог');
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DEGRADED);

    service.applyProbeResult(SOURCE, 'getList вернул пустой каталог');
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DEGRADED);

    service.applyProbeResult(SOURCE, 'getList вернул пустой каталог');
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DOWN);
    expect(service.get(SOURCE).reason).toBe(SOURCE_STATUS_REASON.PROBE_FAILED);
    expect(service.get(SOURCE).failedProbeStreak).toBe(3);
  });

  it('поднимает неработающий источник успешным пробником сразу', () => {
    for (let night = 0; night < 3; night += 1) {
      service.applyProbeResult(SOURCE, 'boom');
    }
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DOWN);

    // Пробник гоняет всю цепочку чтения, а не один запрос, — этого достаточно, чтобы считать
    // источник живым, не дожидаясь серии живых успехов.
    service.applyProbeResult(SOURCE, null);
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.OK);
    expect(service.get(SOURCE).failedProbeStreak).toBe(0);
    expect(service.get(SOURCE).checkedAt).toBeInstanceOf(Date);
  });

  it('не понижает неработающий источник до нестабильного', () => {
    for (let night = 0; night < 3; night += 1) {
      service.applyProbeResult(SOURCE, 'boom');
    }

    service.markDegraded(SOURCE, SOURCE_STATUS_REASON.REQUEST_FAILURES, 'ещё одна ошибка');
    expect(service.get(SOURCE).status).toBe(SOURCE_STATUS.DOWN);
  });

  it('не двигает statusChangedAt, пока статус не сменился', () => {
    service.applyProbeResult(SOURCE, 'boom');
    const first = service.get(SOURCE).statusChangedAt;

    // Вторая упавшая ночь оставляет источник нестабильным — «нестабилен с» должно указывать на
    // первую поломку, иначе на фронте он вечно выглядел бы сломавшимся только что.
    service.applyProbeResult(SOURCE, 'boom again');
    expect(service.get(SOURCE).statusChangedAt).toBe(first);

    service.applyProbeResult(SOURCE, 'boom again');
    expect(service.get(SOURCE).statusChangedAt).not.toBe(first);
  });
});
