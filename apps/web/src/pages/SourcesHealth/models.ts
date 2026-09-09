import type useSourcesHealth from './hooks/useSourcesHealth';

export type SourcesHealthQuery = ReturnType<typeof useSourcesHealth>;

export const HEALTH_REFETCH_INTERVAL_MS = 10_000;
