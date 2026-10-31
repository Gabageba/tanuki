import { SOURCE_AUTH_FAMILY, catalogEntryFor } from '@tanuki/contracts';
import { decryptSecret, encryptSecret } from '../common/secret-box';
import type { LibSocialTokens, SourceAccountRow } from './source-access.service';

/** Перешифровывает старый общий аккаунт, сохраняя даты, статус и разрешение хранить пароль. */
export const splitLibSocialAccount = (row: SourceAccountRow, key: Buffer) => {
  const oldAad = `${row.userId}:${SOURCE_AUTH_FAMILY.LIBSOCIAL}:`;
  const state = JSON.parse(decryptSecret(key, row.encryptedState, `${oldAad}:state`)) as {
    tokens: LibSocialTokens;
  };
  const tokens = { ...state.tokens };
  const password = row.encryptedPassword
    ? decryptSecret(key, row.encryptedPassword, `${oldAad}:password`)
    : null;
  const accounts: SourceAccountRow[] = [];

  for (const sourceId of [SOURCE_AUTH_FAMILY.MANGALIB, SOURCE_AUTH_FAMILY.HENTAILIB]) {
    const token = tokens[sourceId];
    if (!token) continue;
    const family = catalogEntryFor(sourceId).authFamily!;
    const aad = `${row.userId}:${family}:`;
    accounts.push({
      ...row,
      family,
      encryptedPassword: password ? encryptSecret(key, password, `${aad}:password`) : null,
      encryptedState: encryptSecret(
        key,
        JSON.stringify({ tokens: { [sourceId]: token } }),
        `${aad}:state`,
      ),
    });
    delete tokens[sourceId];
  }

  return {
    accounts,
    legacy: Object.keys(tokens).length
      ? {
          ...row,
          encryptedState: encryptSecret(key, JSON.stringify({ tokens }), `${oldAad}:state`),
        }
      : null,
  };
};
