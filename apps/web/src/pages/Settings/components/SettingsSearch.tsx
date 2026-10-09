import { Switch } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import { DEFAULT_SAVE_SEARCH_HISTORY, type UserSettings } from '@tanuki/contracts';
import { SEARCH_HISTORY_QUERY_KEY } from '@/entities/search/hooks/useSearchHistory';
import useUserSettings, { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import GroupedList from '@/shared/ui/GroupedList';

/** «Сохранять историю поиска»: выключение сразу стирает недавние на сервере и в дропдауне. */
function SettingsSearch() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();
  const updateUserSettings = useUpdateUserSettings();
  const saveSearchHistory = settings?.saveSearchHistory ?? DEFAULT_SAVE_SEARCH_HISTORY;

  const handleChange = (checked: boolean) => {
    queryClient.setQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY, (current) => ({
      ...current,
      saveSearchHistory: checked,
    }));
    updateUserSettings.mutate(
      { saveSearchHistory: checked },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY }),
        onError: () => queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY }),
      },
    );
  };

  return (
    <GroupedList label={t('search')}>
      <GroupedList.Row
        icon={<ClockCounterClockwiseIcon />}
        title={t('saveSearchHistory')}
        description={t('recentSearchesVisibleInSearchBar')}
        action={
          <Switch
            checked={saveSearchHistory}
            onChange={(event) => handleChange(event.currentTarget.checked)}
          />
        }
      />
    </GroupedList>
  );
}

export default SettingsSearch;
