import type { ReactNode } from 'react';
import type { EnumLiteralsOf, Source, SourcesResponse } from '@tanuki/contracts';
import { flattenSources } from '@/entities/source/lib';

const matchesQuery = (source: Source, query: string) =>
  source.title.toLowerCase().includes(query) || source.domain.toLowerCase().includes(query);

export const getFilteredSources = (data: SourcesResponse | undefined, query: string): Source[] => {
  const normalizedQuery = query.trim().toLowerCase();

  return flattenSources(data).filter((source) => matchesQuery(source, normalizedQuery));
};

export const ACTIVE_SELECTION_KINDS = {
  SOURCE: 'SOURCE',
  ALL: 'ALL',
  NONE: 'NONE',
} as const;
export type ActiveSelectionKind = EnumLiteralsOf<typeof ACTIVE_SELECTION_KINDS>;

export type ActiveSelection = {
  title: string;
  icon: ReactNode;
  kind: ActiveSelectionKind;
  sourceId?: string;
};
