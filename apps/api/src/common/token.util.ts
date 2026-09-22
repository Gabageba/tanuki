import { createHash, randomBytes } from 'node:crypto';

/**
 * Случайный токен, который уходит наружу — в cookie сессии или в ссылку письма. Хранится
 * никогда: в базе лежит только его хэш (hashToken), угнанный дамп таблицы не даёт войти.
 */
export const generateToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
