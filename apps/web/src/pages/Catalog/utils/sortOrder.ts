import {
  SORT_ORDER,
  SORT_DIRECTION,
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

export const getSortOrderLabel = (order: SortOrder): string => {
  switch (order) {
    case SORT_ORDER.UPDATED:
      return 'Дате обновления';
    case SORT_ORDER.RELEASED:
      return 'Дате релиза';
    case SORT_ORDER.ADDED:
      return 'Дате добавления';
    case SORT_ORDER.POPULARITY:
      return 'По популярности';
    case SORT_ORDER.VIEWS_TODAY:
      return 'Просмотры за день';
    case SORT_ORDER.VIEWS_WEEK:
      return 'Просмотры за неделю';
    case SORT_ORDER.VIEWS_MONTH:
      return 'Просмотры за месяц';
    case SORT_ORDER.RATING:
      return 'По рейтингу';
    case SORT_ORDER.RATING_COUNT:
      return 'Коли-ву оценок';
    case SORT_ORDER.LIKES:
      return 'По лайкам';
    case SORT_ORDER.COMMENTS:
      return 'По отзывам';
    case SORT_ORDER.VIEWS:
      return 'По просмотрам';
    case SORT_ORDER.CHAPTERS:
      return 'По Кол-ву глав';
    case SORT_ORDER.PAGES:
      return 'По Кол-ву страниц';
    case SORT_ORDER.BOOKMARKS:
      return 'По закладкам';
    case SORT_ORDER.ALPHABETICAL:
      return 'По названию';
    case SORT_ORDER.ALPHABETICAL_EN:
      return 'По названию (A-Z)';
    case SORT_ORDER.ALPHABETICAL_RU:
      return 'По названию (А-Я)';
  }
};

export const getSortDirectionLabel = (direction: SortDirection): string => {
  switch (direction) {
    case SORT_DIRECTION.DESC:
      return 'По убыванию';
    case SORT_DIRECTION.ASC:
      return 'По возрастанию';
  }
};
