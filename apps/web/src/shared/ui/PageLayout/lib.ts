import { mergeQueries } from '../QueryBlock/lib';
import type { PageLayoutBaseQuery } from './models';

const isFailedWithoutData = (query: PageLayoutBaseQuery) =>
  query.isError && query.data === undefined;

/** Запрос ответил: данными или ошибкой. Перезапрос упавшего ждёт его блок, а не вся страница. */
const isSettled = (query: PageLayoutBaseQuery) =>
  query.data !== undefined || isFailedWithoutData(query);

/**
 * Несколько запросов страницы как один статус для Content. Скелетон и «Нет соединения» — как у
 * `mergeQueries`. С `requireAll` страница падает, когда упал любой: без него содержимому показать
 * нечего. Без `requireAll` — только когда упали все: упавший один — забота его блока, который
 * покажет своё пустое состояние, а остальные блоки страницы остаются.
 */
export const mergePageQueries = (
  queries: PageLayoutBaseQuery[],
  requireAll: boolean,
): PageLayoutBaseQuery => {
  const merged = mergeQueries(queries);
  const isPending = queries.some((query) => query.isPending);
  if (requireAll) {
    return { ...merged, isPending };
  }

  const isAllFailed = queries.every(isFailedWithoutData);
  return {
    ...merged,
    data: !isAllFailed && queries.every(isSettled) ? queries.map((query) => query.data) : undefined,
    isError: isAllFailed,
    error: isAllFailed ? merged.error : null,
    isPending,
  };
};
