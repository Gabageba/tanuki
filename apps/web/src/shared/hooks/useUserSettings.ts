import { useQuery } from '@tanstack/react-query';
import type { UserSettings } from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { apiFetch } from '@/shared/api/client';

export const USER_SETTINGS_QUERY_KEY = ['user-settings'] as const;

/** Для гостя источник настроек — localStorage (см. shared/lib/settings.ts), запрос выключен, пока
 *  нет сессии. */
function useUserSettings() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: USER_SETTINGS_QUERY_KEY,
    queryFn: () => apiFetch<UserSettings>('/user-settings'),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

export default useUserSettings;
