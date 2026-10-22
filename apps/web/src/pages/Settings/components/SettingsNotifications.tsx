import { Stack, Switch, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { BellRingingIcon, BellSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isStaffRole, type NotificationCategory, type UserSettings } from '@tanuki/contracts';
import usePushDevice from '@/entities/notification/hooks/usePushDevice';
import {
  getCategoryDescription,
  getCategoryIcon,
  getCategoryLabel,
  getPushDeviceDescription,
  getVisibleCategories,
  isPushDeviceToggleDisabled,
} from '@/entities/notification/lib';
import { PUSH_DEVICE_STATE } from '@/entities/notification/models';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import type useUserSettings from '@/shared/hooks/useUserSettings';
import PageLayout from '@/shared/ui/PageLayout';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import { mergeQueries } from '@/shared/ui/QueryBlock/lib';
import GroupedList from '@/shared/ui/GroupedList';

/**
 * Вкладка «Уведомления»: тумблер push на этом устройстве (подписка живёт в браузере) и тумблеры
 * категорий (настройка аккаунта — действует на все устройства). В ленте записи остаются при любых
 * настройках: выключается только push.
 */
function SettingsNotifications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const settingsQuery = PageLayout.useQuery<ReturnType<typeof useUserSettings>>();
  const settings = settingsQuery.data;
  const device = usePushDevice();
  const { isSkeleton } = useSkeletonTiming(mergeQueries([settingsQuery, device.query]));
  const updateUserSettings = useUpdateUserSettings();

  const disabledCategories = settings?.pushDisabledCategories ?? [];
  const isOn = device.state === PUSH_DEVICE_STATE.ON;

  const handleCategoryChange = (category: NotificationCategory, checked: boolean) => {
    const next = checked
      ? disabledCategories.filter((item) => item !== category)
      : [...disabledCategories, category];
    queryClient.setQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY, (current) => ({
      ...current,
      pushDisabledCategories: next,
    }));
    updateUserSettings.mutate(
      { pushDisabledCategories: next },
      { onError: () => queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY }) },
    );
  };

  return (
    <Stack gap="xs" maw={640}>
      <GroupedList label={t('pushNotifications')} loading={isSkeleton}>
        <GroupedList.Row
          icon={isOn ? <BellRingingIcon /> : <BellSlashIcon />}
          title={t('onThisDevice')}
          description={getPushDeviceDescription(device.state, t)}
          isActionCompact
          action={
            <Switch
              checked={isOn}
              disabled={
                !device.isAvailable || isPushDeviceToggleDisabled(device.state) || device.isChanging
              }
              onChange={(event) =>
                event.currentTarget.checked ? device.enable() : device.disable()
              }
              aria-label={t('onThisDevice')}
            />
          }
        />
        {getVisibleCategories(isStaffRole(user?.role)).map((category) => (
          <GroupedList.Row
            key={category}
            icon={getCategoryIcon(category, 24)}
            title={getCategoryLabel(category, t)}
            description={getCategoryDescription(category, user?.role, t)}
            isActionCompact
            action={
              <Switch
                checked={!disabledCategories.includes(category)}
                onChange={(event) => handleCategoryChange(category, event.currentTarget.checked)}
                aria-label={getCategoryLabel(category, t)}
              />
            }
          />
        ))}
      </GroupedList>
      <Text fz="xs" c="dimmed" lh="tight">
        {t('deviceSwitchOnlyHereCategoriesOnAllDevices')}
      </Text>
    </Stack>
  );
}

export default SettingsNotifications;
