import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

function useProbeAllSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch('/sources/probe', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: 'Проверка закончена', message: 'Все источники' });
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: error instanceof ApiRequestError ? error.message : 'Проверка не прошла',
      }),
  });
}

export default useProbeAllSources;
