import { useEffect, useRef } from 'react';
import {
  experimental_streamedQuery as streamedQuery,
  hashKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { SEARCH_STREAM_EVENT } from '@tanuki/contracts';
import { SEARCH_HISTORY_QUERY_KEY } from '@/entities/search/hooks/useSearchHistory';
import {
  applySearchEvent,
  createErrorGroupMessage,
  readSearchStream,
  writeSearchFilters,
} from '../lib';
import { INITIAL_SEARCH_STREAM_DATA, type SearchFilters, type SearchStreamData } from '../models';

type Params = {
  query: string;
  filters: SearchFilters;
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Поиск потоком: `data` появляется с первым событием (порядок мест) и дополняется по мере ответов
 * источников, `isDone` — ответили все. `retryMissed` — отдельный поток только по не ответившим:
 * их места снова становятся скелетонами, найденное у остальных не трогается.
 */
function useSearch({ query, filters }: Params) {
  const queryClient = useQueryClient();
  const queryKey = ['search', query, filters];
  const queryHash = hashKey(queryKey);
  const retryControllerRef = useRef<AbortController | null>(null);

  // Повтор принадлежит своей выдаче: новый запрос или уход со страницы его обрывают.
  useEffect(() => () => retryControllerRef.current?.abort(), [queryHash]);

  const search = useQuery({
    queryKey,
    queryFn: streamedQuery({
      streamFn: async function* ({ signal }) {
        const params = writeSearchFilters(new URLSearchParams({ query }), filters);
        let sourceIds: string[] = [];
        const answered = new Set<string>();
        try {
          for await (const message of readSearchStream(`/search?${params.toString()}`, signal)) {
            if (message.type === SEARCH_STREAM_EVENT.SOURCES) sourceIds = message.data.sourceIds;
            if (message.type === SEARCH_STREAM_EVENT.GROUP) answered.add(message.data.sourceId);
            yield message;
            // Сервер записал запрос в недавние — дропдаун шапки должен его показать.
            if (message.type === SEARCH_STREAM_EVENT.DONE) {
              void queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY });
            }
          }
        } catch (error) {
          // Поток оборвался посреди веера — места, не успевшие ответить, уходят в «Не ответили»,
          // а не остаются скелетонами.
          if (!isAbortError(error)) {
            for (const sourceId of sourceIds) {
              if (!answered.has(sourceId)) yield createErrorGroupMessage(sourceId);
            }
          }
          throw error;
        }
      },
      reducer: applySearchEvent,
      initialValue: INITIAL_SEARCH_STREAM_DATA,
    }),
    enabled: query.length > 0,
    // Веер опрашивает все источники и пишет запрос в недавние — повторяет его только сам человек.
    retry: false,
    refetchOnWindowFocus: false,
    // Смена фильтров: старая выдача — до первого события нового потока, потом места скелетонами.
    // Новая строка поиска старую выдачу не показывает.
    placeholderData: (previous: SearchStreamData | undefined, previousQuery) =>
      previousQuery?.queryKey[1] === query ? previous : undefined,
  });

  const retry = useMutation({
    mutationFn: async (sourceIds: string[]) => {
      retryControllerRef.current?.abort();
      const controller = new AbortController();
      retryControllerRef.current = controller;

      const previous = queryClient.getQueryData<SearchStreamData>(queryKey);
      const update = (updater: (data: SearchStreamData) => SearchStreamData) =>
        queryClient.setQueryData<SearchStreamData>(queryKey, (data) => data && updater(data));

      update((data) => ({
        ...data,
        groups: data.groups.filter(({ sourceId }) => !sourceIds.includes(sourceId)),
      }));
      const params = writeSearchFilters(new URLSearchParams({ query, retry: '1' }), {
        ...filters,
        sources: sourceIds,
      });
      try {
        for await (const message of readSearchStream(
          `/search?${params.toString()}`,
          controller.signal,
        )) {
          if (message.type === SEARCH_STREAM_EVENT.GROUP) {
            update((data) => applySearchEvent(data, message));
          }
        }
      } catch (error) {
        // Отменённый повтор — не сбой: о нём не сообщают.
        if (!isAbortError(error)) throw error;
      } finally {
        // Повтор оборвался — источники, не успевшие ответить, возвращаются в «Не ответили».
        update((data) => ({
          ...data,
          groups: [
            ...data.groups,
            ...(previous?.groups ?? []).filter(
              ({ sourceId }) => !data.groups.some((group) => group.sourceId === sourceId),
            ),
          ],
        }));
      }
    },
  });

  return { ...search, retryMissed: retry.mutate, isRetrying: retry.isPending };
}

export default useSearch;
