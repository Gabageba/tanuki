import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserSettings } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { USER_SETTINGS_QUERY_KEY } from './useUserSettings';

/** Патч летит в БД фоном — UI уже показал выбор через localStorage, ждать ответ сервера незачем. */
function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserSettings) =>
      apiFetch<UserSettings>('/user-settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      }),
    onSuccess: (settings) => queryClient.setQueryData(USER_SETTINGS_QUERY_KEY, settings),
  });
}

export default useUpdateUserSettings;
