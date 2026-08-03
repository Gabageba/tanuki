import type { CacheEntity } from './cache.constants';

export function cacheKey(
  entity: CacheEntity,
  sourceId: string,
  ...parts: Array<string | number>
): string {
  return ['cache', entity, sourceId, ...parts].join(':');
}
