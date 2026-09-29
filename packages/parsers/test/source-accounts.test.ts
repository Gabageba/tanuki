import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { currentSourceAccount, runWithSourceAccounts } from '../src/core/source-accounts';
import { parseLibSocialAuthValue } from '../src/sources/libsocial/auth';

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('source account scope', () => {
  it('keeps concurrent scopes apart across awaits', async () => {
    const jarA = new CookieJar();
    const jarB = new CookieJar();

    const readAfter = (ms: number) => async () => {
      await tick(ms);
      return currentSourceAccount(SOURCE_AUTH_FAMILY.GROUPLE)?.jar;
    };

    const [a, b] = await Promise.all([
      runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.GROUPLE]: { jar: jarA } }, readAfter(20)),
      runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.GROUPLE]: { jar: jarB } }, readAfter(5)),
    ]);

    expect(a).toBe(jarA);
    expect(b).toBe(jarB);
  });

  it('has no account outside a scope or for another family', async () => {
    expect(currentSourceAccount(SOURCE_AUTH_FAMILY.GROUPLE)).toBeUndefined();
    const other = await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.GROUPLE]: { jar: new CookieJar() } },
      async () => currentSourceAccount(SOURCE_AUTH_FAMILY.LIBSOCIAL),
    );
    expect(other).toBeUndefined();
  });
});

describe('parseLibSocialAuthValue', () => {
  it('reads the token from the site localStorage value', () => {
    const value = JSON.stringify({
      token: {
        token_type: 'Bearer',
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
        timestamp: 1_000,
      },
      auth: { id: 1, username: 'aki' },
    });
    expect(parseLibSocialAuthValue(value)).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 1_000 + 3_600_000,
    });
  });

  it('treats a bare refresh token as already expired', () => {
    expect(parseLibSocialAuthValue('def50200abcdefabcdefabcdef')).toEqual({
      accessToken: '',
      refreshToken: 'def50200abcdefabcdefabcdef',
      expiresAt: 0,
    });
  });

  it('rejects values without a refresh token', () => {
    expect(parseLibSocialAuthValue('{"token":{"access_token":"a"}}')).toBeNull();
    expect(parseLibSocialAuthValue('short')).toBeNull();
    expect(parseLibSocialAuthValue('   ')).toBeNull();
  });
});
