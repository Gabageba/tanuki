import { EmptyState, Paper } from '@mantine/core';
import { ChartBarIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

function ProfileStatisticsEmpty() {
  const { t } = useTranslation();

  return (
    <Paper withBorder p="lg" mt="lg">
      <EmptyState
        title={t('noStatisticsYet')}
        description={t('finishFirstChapterForStatistics')}
        icon={<ChartBarIcon />}
      />
    </Paper>
  );
}

export default ProfileStatisticsEmpty;
