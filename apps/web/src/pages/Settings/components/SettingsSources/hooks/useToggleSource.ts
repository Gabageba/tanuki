import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SourcesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

const SOURCES_QUERY_KEY = ['sources'];

type Variables = {
  sourceId: string;
  isEnabled: boolean;
};

const withEnabled = (data: SourcesResponse, { sourceId, isEnabled }: Variables) =>
  Object.fromEntries(
    Object.entries(data).map(([contentType, sources]) => [
      contentType,
      sources.map((source) => (source.id === sourceId ? { ...source, isEnabled } : source)),
    ]),
  ) as SourcesResponse;

/** Тумблер переключается сразу, не дожидаясь сервера; при ошибке возвращается обратно. */
function useToggleSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, isEnabled }: Variables) =>
      apiFetch(`/sources/${sourceId}/enabled`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: SOURCES_QUERY_KEY });
      const previous = queryClient.getQueryData<SourcesResponse>(SOURCES_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(SOURCES_QUERY_KEY, withEnabled(previous, variables));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(SOURCES_QUERY_KEY, context.previous);
    },
  });
}

export default useToggleSource;
