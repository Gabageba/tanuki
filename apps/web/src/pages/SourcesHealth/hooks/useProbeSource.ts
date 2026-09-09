import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

type Params = { sourceId: string; sourceTitle: string };

function useProbeSource({ sourceId, sourceTitle }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch(`/sources/${sourceId}/probe`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: 'Проверка прошла', message: sourceTitle });
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: error instanceof ApiRequestError ? error.message : 'Запрос не прошёл',
      }),
  });
}

export default useProbeSource;
