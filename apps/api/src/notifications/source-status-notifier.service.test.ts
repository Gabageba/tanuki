import { describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATION_TYPE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  USER_ROLE,
} from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import type { NotificationsService } from './notifications.service';
import { SourceStatusNotifierService } from './source-status-notifier.service';

const SOURCE = 'readmanga_ru';

/** Первый select — держатели закладок на источнике, второй — персонал. */
const createService = () => {
  const selectDistinct = () => ({
    from: () => ({
      where: () => Promise.resolve([{ userId: 'reader-1' }, { userId: 'reader-2' }]),
    }),
  });
  const select = () => ({
    from: () => ({ where: () => Promise.resolve([{ id: USER_ROLE.ADMIN }]) }),
  });
  const notify = vi.fn().mockResolvedValue(null);
  const database = {
    db: { selectDistinct, select },
  } as unknown as DatabaseService;
  const service = new SourceStatusNotifierService(database, {
    notify,
  } as unknown as NotificationsService);
  return { service, notify };
};

describe('SourceStatusNotifierService.onStatusChanged', () => {
  it('источник лёг: читателям sourceDown, персоналу parserDown', async () => {
    const { service, notify } = createService();

    await service.onStatusChanged(
      SOURCE,
      SOURCE_STATUS.DEGRADED,
      SOURCE_STATUS.DOWN,
      SOURCE_STATUS_REASON.PROBE_FAILED,
    );

    const calls = notify.mock.calls.map(([userId, input]) => [userId, input.type, input.groupKey]);
    expect(calls).toEqual([
      ['reader-1', NOTIFICATION_TYPE.SOURCE_DOWN, `source:${SOURCE}`],
      ['reader-2', NOTIFICATION_TYPE.SOURCE_DOWN, `source:${SOURCE}`],
      [USER_ROLE.ADMIN, NOTIFICATION_TYPE.PARSER_DOWN, `parser:${SOURCE}`],
    ]);
    expect(notify.mock.calls[0]![1].payload).toEqual({
      sourceId: SOURCE,
      reason: SOURCE_STATUS_REASON.PROBE_FAILED,
    });
  });

  it('источник ожил из down: sourceRecovered и parserRecovered', async () => {
    const { service, notify } = createService();

    await service.onStatusChanged(
      SOURCE,
      SOURCE_STATUS.DOWN,
      SOURCE_STATUS.OK,
      SOURCE_STATUS_REASON.RECOVERED,
    );

    const types = notify.mock.calls.map(([, input]) => input.type);
    expect(types).toEqual([
      NOTIFICATION_TYPE.SOURCE_RECOVERED,
      NOTIFICATION_TYPE.SOURCE_RECOVERED,
      NOTIFICATION_TYPE.PARSER_RECOVERED,
    ]);
  });

  it.each([
    [SOURCE_STATUS.OK, SOURCE_STATUS.DEGRADED],
    [SOURCE_STATUS.DEGRADED, SOURCE_STATUS.OK],
    [SOURCE_STATUS.DOWN, SOURCE_STATUS.DEGRADED],
    [SOURCE_STATUS.DOWN, SOURCE_STATUS.DOWN],
  ])('переход %s → %s тревоги не поднимает', async (previous, next) => {
    const { service, notify } = createService();

    await service.onStatusChanged(SOURCE, previous, next, SOURCE_STATUS_REASON.PROBE_FAILED);

    expect(notify).not.toHaveBeenCalled();
  });
});
