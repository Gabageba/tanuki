import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SourceImportRequest, SourceImportResult } from '@tanuki/contracts';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { apiFetch } from '@/shared/api/client';

/**
 * Запись импорта: папки и закладки — сразу, отметки «где остановился» сервер достроит в фоне.
 * Перезапрос закладок не задерживает итог: «Готово» показывается сразу, кеш догоняет фоном.
 */
function useSourceImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SourceImportRequest) =>
      apiFetch<SourceImportResult>('/source-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      }),
    onSuccess: () => void invalidateBookmarks(queryClient),
  });
}

export default useSourceImport;
