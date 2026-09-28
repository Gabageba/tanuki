import { useTranslation } from 'react-i18next';
import { Group } from '@mantine/core';
import type { ChaptersReadPoint } from '@tanuki/contracts';
import { STATISTIC_PERIOD, type StatisticPeriod } from '../lib';
import ChaptersReadCardStat from './ChaptersReadCardStat';

type Props = {
  points: ChaptersReadPoint[];
  total: number;
  period: StatisticPeriod;
};

function ChaptersReadCardFooter({ points, total, period }: Props) {
  const { t, i18n } = useTranslation();

  const average = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(
    total / points.length,
  );
  const record = Math.max(...points.map(({ count }) => count));
  const perPeriodKey =
    period === STATISTIC_PERIOD.YEAR ? 'chaptersPerMonthAbbrev' : 'chaptersPerDayAbbrev';

  return (
    <Group gap="md" align="baseline">
      <ChaptersReadCardStat value={t(perPeriodKey, { value: average })} label={t('onAverage')} />
      <ChaptersReadCardStat
        value={t(perPeriodKey, { value: record })}
        label={t('record')}
        color="var(--mantine-primary-color-filled)"
      />
    </Group>
  );
}

export default ChaptersReadCardFooter;
