import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Interface language. Shared between the frontend (persisted UI language, i18next) and the API
 * (which language to send verification/reset emails in) — one concept, one const.
 */
export const LANGUAGE = {
  RU: 'ru',
  EN: 'en',
} as const;
export type Language = EnumLiteralsOf<typeof LANGUAGE>;

export const LanguageSchema = z.enum(LANGUAGE);
