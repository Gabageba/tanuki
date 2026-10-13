import type { HomeSectionPeriod } from '@tanuki/contracts';
import { SELECTIONS_QUERY_KEY } from '@/features/selections/models';

export const getSelectionsSectionQueryKey = (
  sourceId: string,
  sectionId: string,
  period: HomeSectionPeriod | undefined,
) => [...SELECTIONS_QUERY_KEY, sourceId, sectionId, period ?? null] as const;

/** Следующая порция блока пришла не `ok` — источник упал посреди прокрутки. */
export class SelectionsNextPageError extends Error {}
