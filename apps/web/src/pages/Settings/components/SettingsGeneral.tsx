import { useMemo } from 'react';
import { Select, SimpleGrid } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GlobeIcon, TranslateIcon } from '@phosphor-icons/react';
import { LANGUAGE, getLanguageLabel, type Language } from '@/shared/lib/language';
import type useUserSettings from '@/shared/hooks/useUserSettings';
import PageLayout from '@/shared/ui/PageLayout';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import { PROFILE_STATISTICS_QUERY_KEY } from '@/entities/user/hooks/useProfileStatistics';
import GroupedList from '@/shared/ui/GroupedList';
import ColorSchemePicker from './ColorSchemePicker';
import SettingsAdultContent from './SettingsAdultContent';
import SettingsSearch from './SettingsSearch';

function SettingsGeneral() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const settingsQuery = PageLayout.useQuery<ReturnType<typeof useUserSettings>>();
  const settings = settingsQuery.data;
  const { isSkeleton } = useSkeletonTiming(settingsQuery);
  const updateUserSettings = useUpdateUserSettings();

  const languages = Object.values(LANGUAGE).map((value) => ({
    value,
    label: getLanguageLabel(value),
  }));

  const timeZones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);
  const timeZone = settings?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleTimeZoneChange = (value: string | null) => {
    if (!value) return;
    updateUserSettings.mutate(
      { timeZone: value },
      // Сутки в статистике режутся по поясу — старые цифры после смены уже неверны.
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_STATISTICS_QUERY_KEY }),
      },
    );
  };

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <ColorSchemePicker loading={isSkeleton} />
      <GroupedList label={t('languageAndRegion')} loading={isSkeleton} skeletonRows={2}>
        <GroupedList.Row
          icon={<TranslateIcon />}
          title={t('interfaceLanguage')}
          description={t('menusButtonsEmails')}
          action={
            <Select
              data={languages}
              value={i18n.language}
              onChange={(value) => value && i18n.changeLanguage(value as Language)}
              allowDeselect={false}
            />
          }
        />
        <GroupedList.Row
          icon={<GlobeIcon />}
          title={t('timeZone')}
          description={t('streakDaysAndReleaseScheduleUseIt')}
          action={
            <Select
              data={timeZones}
              value={timeZone}
              onChange={handleTimeZoneChange}
              disabled={updateUserSettings.isPending}
              allowDeselect={false}
              searchable
              nothingFoundMessage={t('nothingFound')}
              // Длинные пояса (America/Argentina/ComodRivadavia) шире инпута: без этого опции
              // вылезают за дропдаун и обрезаются вместе с галочкой.
              comboboxProps={{ width: 'max-content', position: 'bottom-end' }}
            />
          }
        />
      </GroupedList>
      <SettingsAdultContent />
      <SettingsSearch />
    </SimpleGrid>
  );
}

export default SettingsGeneral;
