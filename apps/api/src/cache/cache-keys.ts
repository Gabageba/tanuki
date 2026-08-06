import type { CacheEntity } from './cache.constants';

export const cacheKey = (
  entity: CacheEntity,
  sourceId: string,
  ...parts: Array<string | number>
): string => {
  return ['cache', entity, sourceId, ...parts].join(':');
};
