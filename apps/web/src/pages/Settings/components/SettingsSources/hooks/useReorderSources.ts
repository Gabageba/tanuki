import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SourcesResponse, UpdateSourcesOrderRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

const SOURCES_QUERY_KEY = ['sources'];

const withOrder = (data: SourcesResponse, sourceIds: string[]) =>
  Object.fromEntries(
    Object.entries(data).map(([contentType, sources]) => [
      contentType,
      sources
        .map((source) => ({ ...source, position: sourceIds.indexOf(source.id) }))
        .sort((a, b) => a.position - b.position),
    ]),
  ) as SourcesResponse;

/** Строка встаёт на новое место сразу, не дожидаясь сервера; при ошибке порядок возвращается. */
function useReorderSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceIds: string[]) =>
      apiFetch('/sources/order', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceIds } satisfies UpdateSourcesOrderRequest),
      }),
    onMutate: async (sourceIds) => {
      await queryClient.cancelQueries({ queryKey: SOURCES_QUERY_KEY });
      const previous = queryClient.getQueryData<SourcesResponse>(SOURCES_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(SOURCES_QUERY_KEY, withOrder(previous, sourceIds));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(SOURCES_QUERY_KEY, context.previous);
    },
  });
}

export default useReorderSources;
