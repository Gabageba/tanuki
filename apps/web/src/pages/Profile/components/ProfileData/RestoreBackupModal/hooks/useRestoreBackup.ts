import { useMantineColorScheme } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BackupRestoreResult, RestoreBackupRequest, UserSettings } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import { applyUserSettings } from '@/shared/lib/applyUserSettings';

/**
 * Запись копии. Она задевает почти всё — закладки, папки, прогресс, статистику, настройки и
 * источники, — поэтому после неё перезапрашивается весь кеш. Применённые настройки ставятся тем же
 * путём, что при входе: тема и язык меняются сразу.
 */
function useRestoreBackup() {
  const queryClient = useQueryClient();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { i18n } = useTranslation();

  return useMutation({
    mutationFn: (request: RestoreBackupRequest) =>
      apiFetch<BackupRestoreResult>('/backup/restore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      }),
    // Перезапрос не задерживает итог: «Готово» показывается сразу, кеш догоняет фоном.
    onSuccess: (result) =>
      void queryClient.invalidateQueries().then(() => {
        const settings = queryClient.getQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY);
        if (result.settingsApplied && settings) {
          applyUserSettings(settings, { colorScheme, setColorScheme, i18n });
        }
      }),
  });
}

export default useRestoreBackup;
