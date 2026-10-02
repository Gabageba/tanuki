import { describe, expect, it } from 'vitest';
import { USER_STATUS } from '@tanuki/contracts';
import { computeUserStatus } from './managed-users.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;

const baseUser = {
  blockedAt: null as Date | null,
  blockedUntil: null as Date | null,
  deletionScheduledAt: null as Date | null,
  emailVerifiedAt: new Date() as Date | null,
};

describe('computeUserStatus', () => {
  it('active — почта подтверждена, ни блокировки, ни удаления', () => {
    expect(computeUserStatus(baseUser)).toBe(USER_STATUS.ACTIVE);
  });

  it('unverified — почта не подтверждена', () => {
    expect(computeUserStatus({ ...baseUser, emailVerifiedAt: null })).toBe(USER_STATUS.UNVERIFIED);
  });

  it('deletionScheduled перебивает неподтверждённую почту', () => {
    expect(
      computeUserStatus({ ...baseUser, emailVerifiedAt: null, deletionScheduledAt: new Date() }),
    ).toBe(USER_STATUS.DELETION_SCHEDULED);
  });

  it('blocked — бессрочная блокировка перебивает и удаление', () => {
    expect(
      computeUserStatus({ ...baseUser, blockedAt: new Date(), deletionScheduledAt: new Date() }),
    ).toBe(USER_STATUS.BLOCKED);
  });

  it('blocked — срок блокировки ещё не прошёл', () => {
    expect(
      computeUserStatus({
        ...baseUser,
        blockedAt: new Date(),
        blockedUntil: new Date(Date.now() + DAY_MS),
      }),
    ).toBe(USER_STATUS.BLOCKED);
  });

  it('блокировка с прошедшим сроком кончилась сама — человек снова активен', () => {
    expect(
      computeUserStatus({
        ...baseUser,
        blockedAt: new Date(Date.now() - 2 * DAY_MS),
        blockedUntil: new Date(Date.now() - DAY_MS),
      }),
    ).toBe(USER_STATUS.ACTIVE);
  });
});
