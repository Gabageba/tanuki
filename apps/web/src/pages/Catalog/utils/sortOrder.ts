import {
  SORT_ORDER,
  SORT_DIRECTION,
  SortOrderSchema,
  SortDirectionSchema,
  type SortOrder,
  type SortDirection,
} from '@tanuki/contracts';

// Пока пользователь не выбрал сортировку сам, используем первую из тех, что поддерживает источник.
export const resolveOrder = (
  explicitOrder: SortOrder | undefined,
  sortOrders: SortOrder[] | undefined,
): SortOrder | undefined => explicitOrder ?? sortOrders?.[0];

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
    case SORT_ORDER.NEWEST:
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
    case SORT_ORDER.VIEWS:
      return 'По просмотрам';
    case SORT_ORDER.CHAPTERS:
      return 'По Кол-ву глав';
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
