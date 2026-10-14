export const SELECTIONS_QUERY_KEY = ['selections'] as const;

export const getSelectionsQueryKey = (sourceId: string) =>
  [...SELECTIONS_QUERY_KEY, sourceId] as const;

/** Последний открытый источник подборок — удобство одного устройства, как свёрнутые секции
 *  поиска до их синхронизации: в настройки пользователя не пишется. */
export const LAST_SELECTIONS_SOURCE_STORAGE_KEY = 'tanuki-last-selections-source';
