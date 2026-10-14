import { SELECTIONS_QUERY_KEY } from '@/features/selections/models';

export const getSelectionsSectionQueryKey = (
  sourceId: string,
  sectionId: string,
  variant: string | undefined,
) => [...SELECTIONS_QUERY_KEY, sourceId, sectionId, variant ?? null] as const;

/** Следующая порция блока пришла не `ok` — источник упал посреди прокрутки. */
export class SelectionsNextPageError extends Error {}
