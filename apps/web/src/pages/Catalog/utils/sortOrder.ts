import { SORT_ORDER, SortOrderSchema, type SortOrder, type Source } from '@tanuki/contracts';

// Пока пользователь не выбрал сортировку сам, используем первую из тех, что поддерживает источник.
export const resolveOrder = (
  explicitOrder: SortOrder | undefined,
  source: Source | undefined,
): SortOrder | undefined => explicitOrder ?? source?.sortOrders[0];

// Значение ?order= из урла: валидируем, чтобы битый/устаревший параметр не улетел в запрос как есть.
export const parseSortOrder = (raw: string | null): SortOrder | undefined => {
  const result = SortOrderSchema.safeParse(raw);
  return result.success ? result.data : undefined;
};

export const getSortOrderLabel = (order: SortOrder): string => {
  switch (order) {
    case SORT_ORDER.UPDATED:
      return 'По обновлению';
    case SORT_ORDER.NEWEST:
      return 'Новинки';
    case SORT_ORDER.ADDED:
      return 'По дате добавления';
    case SORT_ORDER.POPULARITY:
      return 'Популярное';
    case SORT_ORDER.POPULARITY_TODAY:
      return 'Популярное за день';
    case SORT_ORDER.POPULARITY_WEEK:
      return 'Популярное за неделю';
    case SORT_ORDER.POPULARITY_MONTH:
      return 'Популярное за месяц';
    case SORT_ORDER.RATING:
      return 'По рейтингу';
    case SORT_ORDER.ALPHABETICAL:
      return 'По алфавиту';
    case SORT_ORDER.ALPHABETICAL_DESC:
      return 'По алфавиту (Я-А)';
  }
};
