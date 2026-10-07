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
  SOURCE: 'source',
  ALL: 'all',
  NONE: 'none',
} as const;
type ActiveSelectionKind = EnumLiteralsOf<typeof ACTIVE_SELECTION_KINDS>;

export type ActiveSelection = {
  title: string;
  icon: ReactNode;
  kind: ActiveSelectionKind;
  sourceId?: string;
};

export const ACCOUNT_MENU_ITEM = {
  PROFILE: 'profile',
  SETTINGS: 'settings',
  SOURCES_HEALTH: 'sourcesHealth',
  MANAGEMENT: 'management',
  PLAYGROUND: 'playground',
} as const;
export type AccountMenuItem = EnumLiteralsOf<typeof ACCOUNT_MENU_ITEM>;

export const ACCOUNT_MENU_SECTION = {
  ACCOUNT: 'account',
  SOURCES: 'sources',
  SERVICE: 'service',
} as const;
export type AccountMenuSection = EnumLiteralsOf<typeof ACCOUNT_MENU_SECTION>;

export type AccountMenuSectionItems = {
  section: AccountMenuSection;
  items: AccountMenuItem[];
};

/** Один состав и порядок меню аккаунта — для выпадающего на десктопе и drawer на телефоне. */
export const ACCOUNT_MENU_SECTIONS: AccountMenuSectionItems[] = [
  {
    section: ACCOUNT_MENU_SECTION.ACCOUNT,
    items: [ACCOUNT_MENU_ITEM.PROFILE, ACCOUNT_MENU_ITEM.SETTINGS],
  },
  { section: ACCOUNT_MENU_SECTION.SOURCES, items: [ACCOUNT_MENU_ITEM.SOURCES_HEALTH] },
  {
    section: ACCOUNT_MENU_SECTION.SERVICE,
    items: [ACCOUNT_MENU_ITEM.MANAGEMENT, ACCOUNT_MENU_ITEM.PLAYGROUND],
  },
];
