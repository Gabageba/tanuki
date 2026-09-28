import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@mantine/core';
import { useState } from 'react';
import type { ChaptersReadPoint } from '@tanuki/contracts';
import ProfileStatisticCard from '../ProfileStatisticCard';
import type { StatisticPeriod } from '../lib';
import { formatBarDate, formatBarLabel, STATISTIC_PERIOD } from '../lib';
import BarChart from '@/shared/ui/BarChart';
import ChaptersReadCardFooter from './ChaptersReadCardFooter';

const WEEK_DAYS = 7;

type Props = {
  chaptersByDay: ChaptersReadPoint[];
  chaptersByMonth: ChaptersReadPoint[];
};

const getPeriodPoints = (
  period: StatisticPeriod,
  chaptersByDay: ChaptersReadPoint[],
  chaptersByMonth: ChaptersReadPoint[],
) => {
  switch (period) {
    case STATISTIC_PERIOD.WEEK:
      return chaptersByDay.slice(-WEEK_DAYS);
    case STATISTIC_PERIOD.MONTH:
      return chaptersByDay;
    case STATISTIC_PERIOD.YEAR:
      return chaptersByMonth;
  }
};

function ChaptersReadCard({ chaptersByDay, chaptersByMonth }: Props) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<StatisticPeriod>(STATISTIC_PERIOD.WEEK);

  const points = getPeriodPoints(period, chaptersByDay, chaptersByMonth);

  const items = points.map(({ date, count }) => ({
    key: date,
    value: count,
    label: formatBarLabel(date, period, i18n.language),
    tooltip: {
      title: formatBarDate(date, period, i18n.language),
      value: t('countChapters', { count }),
    },
  }));

  return (
    <ProfileStatisticCard
      label={t('chaptersRead')}
      extra={
        <SegmentedControl
          size="xs"
          value={period}
          onChange={(value) => setPeriod(value as StatisticPeriod)}
          data={[
            { label: t('week'), value: STATISTIC_PERIOD.WEEK },
            { label: t('month'), value: STATISTIC_PERIOD.MONTH },
            { label: t('year'), value: STATISTIC_PERIOD.YEAR },
          ]}
        />
      }
      footer={<ChaptersReadCardFooter points={points} period={period} />}
    >
      <BarChart
        items={items}
        highlightedIndex={items.length - 1}
        // Подписи через неделю — каждая попадает на тот же день недели, что и сегодня.
        labelStep={WEEK_DAYS}
      />
    </ProfileStatisticCard>
  );
}

export default ChaptersReadCard;
