import { useTranslation } from 'react-i18next';
import { Group, Stack, Text } from '@mantine/core';
import ProfileStatisticCard from './ProfileStatisticCard';
import { READING_TIME_MOCK } from './mocks';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ProgressList from '@/shared/ui/ProgressList';

function ReadingTimeCard() {
  const { t } = useTranslation();
  const { formatDuration, getCurrentMonthName } = useDateFormat();

  const {
    totalMinutes,
    averagePerDayMinutes,
    weekdaysPerDayMinutes,
    weekendsPerDayMinutes,
    peakFrom,
    peakTo,
    peakPercent,
    averageSessionMinutes,
  } = READING_TIME_MOCK;

  const maxPerDay = Math.max(averagePerDayMinutes, weekdaysPerDayMinutes, weekendsPerDayMinutes);

  return (
    <ProfileStatisticCard
      label={t('Время чтения')}
      footer={
        <Text fz={12} c="dimmed">
          {t('mostOftenReadBetween', { from: peakFrom, to: peakTo, percent: `${peakPercent}%` })}{' '}
          {t('averageSessionMinutes', { count: averageSessionMinutes })}
        </Text>
      }
    >
      <Stack gap="md">
        <Group gap={8} align="baseline">
          <Text ff="monospace" fz={35} fw={600} lh={1} style={{ wordSpacing: -8 }}>
            {formatDuration(totalMinutes)}
          </Text>
          <Text fz="sm" c="dimmed">
            {t('forMonth', { month: getCurrentMonthName() })}
          </Text>
        </Group>
        <ProgressList
          gap="sm"
          items={[
            {
              key: 'total',
              label: t('total'),
              value: maxPerDay,
              text: formatDuration(totalMinutes),
            },
            {
              key: 'averagePerDay',
              label: t('averagePerDay'),
              value: averagePerDayMinutes,
              text: formatDuration(averagePerDayMinutes),
            },
            {
              key: 'weekdaysPerDay',
              label: t('weekdaysPerDay'),
              value: weekdaysPerDayMinutes,
              text: formatDuration(weekdaysPerDayMinutes),
            },
            {
              key: 'weekendsPerDay',
              label: t('weekendsPerDay'),
              value: weekendsPerDayMinutes,
              text: formatDuration(weekendsPerDayMinutes),
            },
          ]}
          highlightedIndex={1}
        />
      </Stack>
    </ProfileStatisticCard>
  );
}

export default ReadingTimeCard;
