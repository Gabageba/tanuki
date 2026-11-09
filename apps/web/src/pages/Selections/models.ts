import type { SortOrder } from '@tanuki/contracts';
import { SELECTIONS_QUERY_KEY } from '@/features/selections/models';

export const getSelectionsSectionQueryKey = (
  sourceId: string,
  sectionId: string,
  variant: string | undefined,
  order?: SortOrder,
) => [...SELECTIONS_QUERY_KEY, sourceId, sectionId, variant ?? null, order ?? null] as const;

/** Следующая порция блока пришла не `ok` — источник упал посреди прокрутки. */
export class SelectionsNextPageError extends Error {}
