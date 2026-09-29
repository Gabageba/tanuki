import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Случайный токен, который уходит наружу — в cookie сессии или в ссылку письма. Хранится
 * никогда: в базе лежит только его хэш (hashToken), угнанный дамп таблицы не даёт войти.
 */
export const generateToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Сравнение хэшей за постоянное время — по времени ответа не угадать, сколько символов совпало. */
export const isSameHash = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
