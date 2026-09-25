import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@mantine/core';
import { useState } from 'react';
import ProfileStatisticCard from '../ProfileStatisticCard';
import type { StatisticPeriod } from '../lib';
import { formatBarDate, formatBarLabel, STATISTIC_PERIOD } from '../lib';
import BarChart from '@/shared/ui/BarChart';
import ChaptersReadCardFooter from './ChaptersReadCardFooter';
import { getChaptersReadMock } from '../mocks';

function ChaptersReadCard() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<StatisticPeriod>(STATISTIC_PERIOD.WEEK);

  const points = getChaptersReadMock(period);

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
      <BarChart items={items} highlightedIndex={items.length - 1} />
    </ProfileStatisticCard>
  );
}

export default ChaptersReadCard;
