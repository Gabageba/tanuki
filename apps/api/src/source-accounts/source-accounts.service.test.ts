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
  const fetchLibSocialAccountName = vi
    .fn<ParsersRegistry['fetchLibSocialAccountName']>()
    .mockResolvedValue('new-reader');
  const save = vi.fn().mockResolvedValue(undefined);
  const service = new SourceAccountsService(
    { loginAccount: login, linkSession, fetchLibSocialAccountName } as unknown as ParsersRegistry,
    { isLinkingAvailable: true, save } as unknown as SourceAccessService,
  );
  return { service, login, linkSession, fetchLibSocialAccountName, save };
};

describe.each([
  SOURCE_AUTH_FAMILY.REMANGA,
  SOURCE_AUTH_FAMILY.TOMILOLIB,
  SOURCE_AUTH_FAMILY.WAMANGA,
  SOURCE_AUTH_FAMILY.MULTPORN,
])('%s password account linking', (family) => {
  it.each([false, true])(
    'accepts email/password; rememberPassword=%s controls password storage',
    async (rememberPassword) => {
      const { service, login, save } = createService();
      await service.linkWithPassword('user', family, {
        ...INPUT,
        rememberPassword,
      });
      expect(login).toHaveBeenCalledWith(family, {
        username: INPUT.login,
        password: INPUT.password,
      });
      expect(save).toHaveBeenCalledWith('user', family, {
        login: INPUT.login,
        password: rememberPassword ? INPUT.password : null,
        state: { cookies: expect.any(Object) },
      });
    },
  );
});

describe('ReManga account linking', () => {
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

describe('Senkuro account linking', () => {
  it('stores a shared session for Senkuro and Senkognito', async () => {
    const family = SOURCE_AUTH_FAMILY.SENKURO;
    const { service, linkSession, save } = createService();
    await service.linkSession('user', family, 'browser-token');
    expect(linkSession).toHaveBeenCalledWith(family, 'browser-token');
    expect(save).toHaveBeenCalledWith('user', family, {
      login: 'reader',
      password: null,
      state: { cookies: expect.any(Object) },
    });
  });
});

describe('HentaiChan account linking', () => {
  it('stores the verified browser session without a password', async () => {
    const { service, linkSession, save } = createService();
    await service.linkSession('user', SOURCE_AUTH_FAMILY.HENTAICHAN_CC, 'signed-session');
    expect(linkSession).toHaveBeenCalledWith(SOURCE_AUTH_FAMILY.HENTAICHAN_CC, 'signed-session');
    expect(save).toHaveBeenCalledWith('user', SOURCE_AUTH_FAMILY.HENTAICHAN_CC, {
      login: 'reader',
      password: null,
      state: { cookies: expect.any(Object) },
    });
  });
});

describe('LibSocial token linking', () => {
  it.each([SOURCE_AUTH_FAMILY.MANGALIB, SOURCE_AUTH_FAMILY.HENTAILIB])(
    'replaces only the %s account and drops the previous saved password',
    async (family) => {
      const { service, fetchLibSocialAccountName, save } = createService();
      const tokens = {
        accessToken: 'fresh-access',
        refreshToken: 'fresh-refresh',
        expiresAt: 20_000,
      };
      fetchLibSocialAccountName.mockImplementation(async (_, store) => {
        await store.write(tokens);
        return 'new-reader';
      });
      await service.linkLibSocialToken('user', family, 'browser-refresh-token-12345');
      expect(fetchLibSocialAccountName).toHaveBeenCalledWith(family, expect.any(Object));
      expect(save).toHaveBeenCalledExactlyOnceWith('user', family, {
        login: 'new-reader',
        password: null,
        state: { tokens: { [family]: tokens } },
      });
    },
  );
});
