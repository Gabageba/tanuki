import type { TFunction } from 'i18next';
import {
  SORT_ORDER,
  SortOrderSchema,
  SortDirectionSchema,
  type FilterGroup,
  type FilterSelection,
  type Source,
  type SortOrder,
  type SortDirection,
} from '@tanuki/contracts';

// Пока пользователь не выбрал сортировку сам (или выбранная недоступна для активного фильтра —
// см. resolveEffectiveSortOrders), используем первую из тех, что поддерживает источник.
export const resolveOrder = (
  explicitOrder: SortOrder | undefined,
  sortOrders: SortOrder[] | undefined,
): SortOrder | undefined =>
  explicitOrder && sortOrders?.includes(explicitOrder) ? explicitOrder : sortOrders?.[0];

export type EffectiveSortOrders = {
  sortOrders: SortOrder[];
  supportsDirection: boolean;
};

/**
 * Некоторые источники предлагают разный набор сортировок в зависимости от активного фильтра
 * (multporn: tags/characters открывают VIEWS/RATING вместо UPDATED; nudemoon: mangaka/seria/
 * group/perevod теряют PAGES) — см. FilterGroup.sortOrders/supportsDirection. Берём первую
 * активную группу, которая объявляет такое сужение, и используем его вместо дефолта источника.
 */
/**
 * Фильтры не работают, пока набран запрос, если источник при поиске по названию их не применяет
 * (`Source.isSearchWithFiltersSupported`): выбор остаётся в адресе, но не уходит в запрос и не
 * влияет на сортировку — сотрёшь запрос, и он снова в силе.
 */
export const isFiltersLockedByQuery = (
  source: Pick<Source, 'isSearchWithFiltersSupported'> | undefined,
  query: string | undefined,
) => Boolean(query) && source?.isSearchWithFiltersSupported === false;

export const resolveEffectiveSortOrders = (
  source: Pick<Source, 'sortOrders' | 'supportsDirection'> | undefined,
  groups: FilterGroup[] | undefined,
  selection: FilterSelection[] | undefined,
): EffectiveSortOrders => {
  const activeGroupIds = new Set((selection ?? []).map((f) => f.groupId));
  const overrideGroup = groups?.find(
    (group) =>
      activeGroupIds.has(group.id) &&
      (group.sortOrders !== undefined || group.supportsDirection !== undefined),
  );
  return {
    sortOrders: overrideGroup?.sortOrders ?? source?.sortOrders ?? [],
    supportsDirection: overrideGroup?.supportsDirection ?? source?.supportsDirection ?? false,
  };
};

// Значение ?order= из урла: валидируем, чтобы битый/устаревший параметр не улетел в запрос как есть.
export const parseSortOrder = (raw: string | null): SortOrder | undefined => {
  const result = SortOrderSchema.safeParse(raw);
  return result.success ? result.data : undefined;
};

// Значение ?direction= из урла — та же валидация, что и у parseSortOrder.
export const parseSortDirection = (raw: string | null): SortDirection | undefined => {
  const result = SortDirectionSchema.safeParse(raw);
  return result.success ? result.data : undefined;
};

export const getSortOrderLabel = (order: SortOrder, t: TFunction): string => {
  switch (order) {
    case SORT_ORDER.UPDATED:
      return t('updateDate');
    case SORT_ORDER.RELEASED:
      return t('releaseDate');
    case SORT_ORDER.ADDED:
      return t('addedDate');
    case SORT_ORDER.POPULARITY:
      return t('popularity');
    case SORT_ORDER.VIEWS_TODAY:
      return t('viewsToday');
    case SORT_ORDER.VIEWS_WEEK:
      return t('viewsWeek');
    case SORT_ORDER.VIEWS_MONTH:
      return t('viewsMonth');
    case SORT_ORDER.RATING:
      return t('rating');
    case SORT_ORDER.RATING_COUNT:
      return t('scoresCount');
    case SORT_ORDER.LIKES:
      return t('likes');
    case SORT_ORDER.COMMENTS:
      return t('reviews');
    case SORT_ORDER.VIEWS:
      return t('views');
    case SORT_ORDER.CHAPTERS:
      return t('chaptersCount');
    case SORT_ORDER.PAGES:
      return t('pagesCount');
    case SORT_ORDER.BOOKMARKS:
      return t('bookmarks');
    case SORT_ORDER.ALPHABETICAL:
      return t('title');
    case SORT_ORDER.ALPHABETICAL_EN:
      return t('titleLatin');
    case SORT_ORDER.ALPHABETICAL_RU:
      return t('titleCyrillic');
  }
};
