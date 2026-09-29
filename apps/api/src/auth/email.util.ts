import { hashToken } from '../common/token.util';

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** «nikita@gmail.com» → «n***@gmail.com»: адрес узнаваем владельцем, но не раскрыт целиком. */
export const maskEmail = (email: string): string => {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
};

/**
 * Хэш кода смены почты. Шесть цифр совпадают у разных людей, а token_hash уникален — поэтому
 * к коду подмешан id строки: хэши не сталкиваются, и код одного не подходит к строке другого.
 */
export const hashEmailCode = (tokenId: string, code: string): string =>
  hashToken(`${tokenId}:${code}`);
