import { z } from 'zod';
import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Ответ liveness-пробы: сам факт 200 + `ok` и есть весь контракт /health. */
export const HEALTH_STATUS = {
  OK: 'ok',
} as const;
export type HealthStatus = EnumLiteralsOf<typeof HEALTH_STATUS>;

export const HealthResponseSchema = z.object({ status: z.enum(HEALTH_STATUS) });
