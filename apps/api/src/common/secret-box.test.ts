import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from './secret-box';

describe('secret-box', () => {
  const key = randomBytes(32);

  it('round-trips a secret', () => {
    const sealed = encryptSecret(key, 'пароль', 'user:grouple');
    expect(sealed.startsWith('v1.')).toBe(true);
    expect(decryptSecret(key, sealed, 'user:grouple')).toBe('пароль');
  });

  it('refuses a secret moved to another owner', () => {
    const sealed = encryptSecret(key, 'secret', 'user-a:grouple');
    expect(() => decryptSecret(key, sealed, 'user-b:grouple')).toThrow();
  });

  it('refuses a secret sealed with another key', () => {
    const sealed = encryptSecret(key, 'secret', 'aad');
    expect(() => decryptSecret(randomBytes(32), sealed, 'aad')).toThrow();
  });
});
