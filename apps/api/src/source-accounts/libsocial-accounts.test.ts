import { describe, expect, it } from 'vitest';
import { SOURCE_ACCOUNT_STATUS, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { decryptSecret, encryptSecret } from '../common/secret-box';
import type { LibSocialTokens, SourceAccountRow } from './source-access.service';
import { splitLibSocialAccount } from './libsocial-accounts';

const KEY = Buffer.alloc(32, 7);
const TOKENS = {
  mangalib: { accessToken: 'manga-access', refreshToken: 'manga-refresh', expiresAt: 10_000 },
  hentailib: { accessToken: 'hentai-access', refreshToken: 'hentai-refresh', expiresAt: 20_000 },
};
const makeRow = (
  tokens: LibSocialTokens,
  password: string | null = 'secret',
): SourceAccountRow => ({
  userId: 'reader',
  family: SOURCE_AUTH_FAMILY.LIBSOCIAL,
  login: 'reader@example.com',
  status: SOURCE_ACCOUNT_STATUS.ACTIVE,
  encryptedPassword: password ? encryptSecret(KEY, password, 'reader:libsocial::password') : null,
  encryptedState: encryptSecret(KEY, JSON.stringify({ tokens }), 'reader:libsocial::state'),
  linkedAt: new Date('2026-10-29T10:00:00Z'),
  updatedAt: new Date('2026-10-29T10:01:00Z'),
});
const readState = (row: SourceAccountRow) =>
  JSON.parse(decryptSecret(KEY, row.encryptedState, `${row.userId}:${row.family}::state`));

describe('splitLibSocialAccount', () => {
  it('перешифровывает токены отдельно и сохраняет пароль, даты и статус', () => {
    const row = { ...makeRow(TOKENS), status: SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED };
    const { accounts, legacy } = splitLibSocialAccount(row, KEY);
    expect(legacy).toBeNull();
    expect(accounts.map(({ family }) => family)).toEqual([
      SOURCE_AUTH_FAMILY.MANGALIB,
      SOURCE_AUTH_FAMILY.HENTAILIB,
    ]);
    expect(accounts.map(readState)).toEqual([
      { tokens: { mangalib: TOKENS.mangalib } },
      { tokens: { hentailib: TOKENS.hentailib } },
    ]);
    for (const account of accounts) {
      expect(
        decryptSecret(KEY, account.encryptedPassword!, `reader:${account.family}::password`),
      ).toBe('secret');
      expect(account).toMatchObject({
        login: row.login,
        status: row.status,
        linkedAt: row.linkedAt,
        updatedAt: row.updatedAt,
      });
      expect(() => decryptSecret(KEY, account.encryptedState, 'reader:libsocial::state')).toThrow();
    }
    expect(readState(row)).toEqual({ tokens: TOKENS });
  });

  it('не создаёт аккаунт без токена и не добавляет несохранённый пароль', () => {
    const { accounts, legacy } = splitLibSocialAccount(
      makeRow({ hentailib: TOKENS.hentailib }, null),
      KEY,
    );
    expect(legacy).toBeNull();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.family).toBe(SOURCE_AUTH_FAMILY.HENTAILIB);
    expect(accounts[0]?.encryptedPassword).toBeNull();
  });

  it('убирает перенесённые токены из старой строки, сохраняя остальные', () => {
    const row = makeRow({ ...TOKENS, yaoilib: TOKENS.mangalib });
    const { accounts, legacy } = splitLibSocialAccount(row, KEY);
    expect(accounts).toHaveLength(2);
    expect(readState(legacy!)).toEqual({ tokens: { yaoilib: TOKENS.mangalib } });
    expect(splitLibSocialAccount(legacy!, KEY).accounts).toEqual([]);
  });
});
