import { describe, expect, it, vi } from 'vitest';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { CookieJar, SourceLoginRequiresSessionError, type ParsersRegistry } from '@tanuki/parsers';
import type { SourceAccessService } from './source-access.service';
import { SourceAccountsService } from './source-accounts.service';

const INPUT = { login: 'reader@example.com', password: 'test-password', rememberPassword: false };
const createService = () => {
  const login = vi.fn<ParsersRegistry['loginAccount']>().mockResolvedValue(new CookieJar());
  const linkSession = vi
    .fn<ParsersRegistry['linkSession']>()
    .mockResolvedValue({ jar: new CookieJar(), login: 'reader' });
  const save = vi.fn().mockResolvedValue(undefined);
  const service = new SourceAccountsService(
    { loginAccount: login, linkSession } as unknown as ParsersRegistry,
    { isLinkingAvailable: true, save } as unknown as SourceAccessService,
  );
  return { service, login, linkSession, save };
};

describe('ReManga account linking', () => {
  it.each([false, true])(
    'accepts email/password; rememberPassword=%s controls password storage',
    async (rememberPassword) => {
      const { service, login, save } = createService();
      await service.linkWithPassword('user', SOURCE_AUTH_FAMILY.REMANGA, {
        ...INPUT,
        rememberPassword,
      });
      expect(login).toHaveBeenCalledWith(SOURCE_AUTH_FAMILY.REMANGA, {
        username: INPUT.login,
        password: INPUT.password,
      });
      expect(save).toHaveBeenCalledWith('user', SOURCE_AUTH_FAMILY.REMANGA, {
        login: INPUT.login,
        password: rememberPassword ? INPUT.password : null,
        state: { cookies: expect.any(Object) },
      });
    },
  );
  it('explains the session fallback when the site requests a second factor', async () => {
    const { service, login, save } = createService();
    login.mockRejectedValue(
      new SourceLoginRequiresSessionError('Two-factor authentication required', 'remanga'),
    );
    await expect(
      service.linkWithPassword('user', SOURCE_AUTH_FAMILY.REMANGA, INPUT),
    ).rejects.toMatchObject({ messageKey: 'sourceRequiresCodeTransferSession' });
    expect(save).not.toHaveBeenCalled();
  });
  it('keeps browser-session linking as an alternative and does not save a password', async () => {
    const { service, linkSession, save } = createService();
    await service.linkSession('user', SOURCE_AUTH_FAMILY.REMANGA, 'browser-session');
    expect(linkSession).toHaveBeenCalledWith(SOURCE_AUTH_FAMILY.REMANGA, 'browser-session');
    expect(save).toHaveBeenCalledWith('user', SOURCE_AUTH_FAMILY.REMANGA, {
      login: 'reader',
      password: null,
      state: { cookies: expect.any(Object) },
    });
  });
});
