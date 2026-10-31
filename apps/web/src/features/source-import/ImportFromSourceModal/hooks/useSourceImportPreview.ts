import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SourceImportPreview } from '@tanuki/contracts';
import { apiFetch, isSourceAccountRequiredError } from '@/shared/api/client';
import { SOURCE_ACCOUNTS_QUERY_KEY } from '@/entities/source-account/hooks/useSourceAccounts';

type Variables = {
  sourceId: string;
  signal: AbortSignal;
};

/**
 * Чтение закладок на сайте — синхронно, до минуты; сервер ничего не пишет. Отменённый запрос
 * отвечает null, а не ошибкой: отменял сам человек, тост ему не нужен. Сайт не принял вход —
 * аккаунты перечитываются, и шапка сети на шаге «Источник» покажет «Нужен повторный вход».
 */
function useSourceImportPreview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, signal }: Variables) => {
      try {
        return await apiFetch<SourceImportPreview>('/source-import/preview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sourceId }),
          signal,
        });
      } catch (error) {
        if (signal.aborted) return null;
        throw error;
      }
    },
    onError: (error) => {
      if (isSourceAccountRequiredError(error)) {
        void queryClient.invalidateQueries({ queryKey: SOURCE_ACCOUNTS_QUERY_KEY });
      }
    },
  });
}

export default useSourceImportPreview;
