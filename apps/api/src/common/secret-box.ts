import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_BYTES = 12;

/**
 * Шифрует секрет для хранения в БД: `v1.<iv>.<tag>.<шифротекст>` в base64url. aad привязывает
 * шифротекст к строке-владельцу — скопированный в чужую строку он не расшифруется. Префикс
 * версии оставляет место для смены ключа.
 */
export const encryptSecret = (key: Buffer, plaintext: string, aad: string): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), encrypted]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
};

export const decryptSecret = (key: Buffer, sealed: string, aad: string): string => {
  const [version, iv, tag, encrypted] = sealed.split('.');
  if (version !== VERSION || !iv || !tag || encrypted === undefined) {
    throw new Error('Unsupported secret format');
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};
