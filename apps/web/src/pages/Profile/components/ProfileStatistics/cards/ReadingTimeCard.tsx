import { useTranslation } from 'react-i18next';
import { Group, Stack, Text } from '@mantine/core';
import type { ReadingTimeStatistic } from '@tanuki/contracts';
import ProfileStatisticCard from './ProfileStatisticCard';
import { formatHour } from './lib';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ProgressList from '@/shared/ui/ProgressList';

/** Ширина окна пика — столько же часов, сколько отсчитывает сервер. */
const PEAK_WINDOW_HOURS = 2;

type Props = {
  readingTime: ReadingTimeStatistic;
};

function ReadingTimeCard({ readingTime }: Props) {
  const { t } = useTranslation();
  const { formatDuration, getCurrentMonthName } = useDateFormat();

  const {
    totalMinutes,
    averagePerDayMinutes,
    weekdaysPerDayMinutes,
    weekendsPerDayMinutes,
    peak,
    averageSessionMinutes,
  } = readingTime;

  const maxPerDay = Math.max(averagePerDayMinutes, weekdaysPerDayMinutes, weekendsPerDayMinutes);

  return (
    <ProfileStatisticCard
      label={t('readingTime')}
      footer={
        peak && (
          <Text fz={12} c="dimmed">
            {t('mostOftenReadBetween', {
              from: formatHour(peak.fromHour),
              to: formatHour(peak.fromHour + PEAK_WINDOW_HOURS),
              percent: `${peak.percent}%`,
            })}{' '}
            {t('averageSessionMinutes', { count: averageSessionMinutes })}
          </Text>
        )
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
