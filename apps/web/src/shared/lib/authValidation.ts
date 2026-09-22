import type { TFunction } from 'i18next';
import { EmailSchema, PasswordSchema, UsernameSchema } from '@tanuki/contracts';

/**
 * Форма проверяет то же самое, что потом проверит API (схемы те же, из @tanuki/contracts), но
 * сообщения — свои и переведённые: сырое сообщение zod по-английски не годится для UI.
 */
export const validateRequired = (t: TFunction) => (value: string) =>
  value.trim().length > 0 ? null : t('fieldRequired');

export const validateEmail = (t: TFunction) => (value: string) =>
  EmailSchema.safeParse(value.trim()).success ? null : t('invalidEmail');

export const validateUsername = (t: TFunction) => (value: string) =>
  UsernameSchema.safeParse(value).success ? null : t('usernameRules');

export const validatePassword = (t: TFunction) => (value: string) =>
  PasswordSchema.safeParse(value).success ? null : t('passwordTooShort');
