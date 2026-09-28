import { useMemo } from 'react';
import { Paper, Select } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import useUserSettings from '@/shared/hooks/useUserSettings';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import { PROFILE_STATISTICS_QUERY_KEY } from '@/entities/user/hooks/useProfileStatistics';

function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();
  const updateUserSettings = useUpdateUserSettings();

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
    <PageLayout useQuery={useUserSettings}>
      <PageLayout.Content title={t('settings')}>
        <Paper withBorder radius="md" p="lg" maw={480}>
          <Select
            label={t('timeZone')}
            description={t('timeZoneDefinesStatisticsDays')}
            data={timeZones}
            value={timeZone}
            onChange={handleTimeZoneChange}
            disabled={updateUserSettings.isPending}
            allowDeselect={false}
            searchable
            nothingFoundMessage={t('nothingFound')}
          />
        </Paper>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Settings;
