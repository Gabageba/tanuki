import { useTranslation } from 'react-i18next';
import { Group } from '@mantine/core';
import type { ChaptersReadPoint } from '@tanuki/contracts';
import { STATISTIC_PERIOD, type StatisticPeriod } from '../lib';
import ChaptersReadCardStat from './ChaptersReadCardStat';

type Props = {
  points: ChaptersReadPoint[];
  period: StatisticPeriod;
};

function ChaptersReadCardFooter({ points, period }: Props) {
  const { t, i18n } = useTranslation();

  const total = points.reduce((sum, { count }) => sum + count, 0);
  const average = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(
    total / points.length,
  );
  const record = Math.max(...points.map(({ count }) => count));

  return (
    <Group gap="md" align="baseline">
      <ChaptersReadCardStat value={total} label={t('chaptersForPeriod', { count: total })} />
      <ChaptersReadCardStat value={average} label={t('onAverage')} />
      <ChaptersReadCardStat
        value={t(period === STATISTIC_PERIOD.YEAR ? 'valuePerMonth' : 'valuePerDay', {
          value: record,
        })}
        label={t('record')}
        color="var(--mantine-primary-color-filled)"
      />
    </Group>
  );
}

export default ChaptersReadCardFooter;
