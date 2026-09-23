import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReaderSettings } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { READER_SETTINGS_QUERY_KEY } from './useReaderSettings';

/**
 * Настройка применяется сразу, запрос уходит фоном: ждать ответа сервера, чтобы увидеть
 * собственный выбор, пользователь не должен. Если сохранение упало — кэш откатывается к
 * прежнему значению, так что читалка не останется в состоянии, которого нет на сервере.
 */
function useUpdateReaderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: ReaderSettings) =>
      apiFetch<ReaderSettings>('/reader-settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      }),
    onMutate: async (settings) => {
      // Иначе уже летящий GET (например, refetch по возврату фокуса) приземлится поверх
      // только что выбранного значения и вернёт настройку на прежнюю.
      await queryClient.cancelQueries({ queryKey: READER_SETTINGS_QUERY_KEY });
      const previous = queryClient.getQueryData<ReaderSettings>(READER_SETTINGS_QUERY_KEY);
      queryClient.setQueryData(READER_SETTINGS_QUERY_KEY, settings);
      return { previous };
    },
    onError: (_error, _settings, context) => {
      if (context?.previous) {
        queryClient.setQueryData(READER_SETTINGS_QUERY_KEY, context.previous);
      }
    },
  });
}

export default useUpdateReaderSettings;
