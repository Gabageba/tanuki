import { describe, expect, it } from 'vitest';
import { INVITE_STATUS } from '@tanuki/contracts';
import { computeInviteStatus } from './invites.mapper';

const HOUR_MS = 60 * 60 * 1000;

const baseRow = {
  usedAt: null as Date | null,
  revokedAt: null as Date | null,
  expiresAt: new Date(Date.now() + HOUR_MS),
};

describe('computeInviteStatus', () => {
  it('active — ничего не произошло и срок ещё не вышел', () => {
    expect(computeInviteStatus(baseRow)).toBe(INVITE_STATUS.ACTIVE);
  });

  it('expired — срок истёк, а инвайтом так и не воспользовались', () => {
    expect(computeInviteStatus({ ...baseRow, expiresAt: new Date(Date.now() - HOUR_MS) })).toBe(
      INVITE_STATUS.EXPIRED,
    );
  });

  it('revoked — админ отозвал ещё активный инвайт', () => {
    expect(computeInviteStatus({ ...baseRow, revokedAt: new Date() })).toBe(INVITE_STATUS.REVOKED);
  });

  it('used — им зарегистрировались, даже если срок с тех пор истёк', () => {
    expect(
      computeInviteStatus({
        ...baseRow,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() - HOUR_MS),
      }),
    ).toBe(INVITE_STATUS.USED);
  });

  it('used перебивает revoked — отозвать уже использованный инвайт нельзя (см. InvitesService.revoke)', () => {
    expect(computeInviteStatus({ ...baseRow, usedAt: new Date(), revokedAt: new Date() })).toBe(
      INVITE_STATUS.USED,
    );
  });
});
