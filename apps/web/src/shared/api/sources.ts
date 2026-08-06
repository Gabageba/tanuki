import type { Source, SourcesResponse } from '@tanuki/contracts';

/** /sources отдаёт группы по contentType — для поиска источника по id нужен плоский список. */
export const flattenSources = (data: SourcesResponse | undefined): Source[] => {
  return data ? Object.values(data).flat() : [];
};
