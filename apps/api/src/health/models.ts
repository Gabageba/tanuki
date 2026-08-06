import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Ответ liveness-пробы: сам факт 200 + `ok` и есть весь контракт /health. */
export const HEALTH_STATUS = {
  ok: 'ok',
} as const;
export type HealthStatus = EnumLiteralsOf<typeof HEALTH_STATUS>;
