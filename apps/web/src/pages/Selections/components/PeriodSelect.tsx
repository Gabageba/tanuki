import { Select } from '@mantine/core';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { HOME_SECTION_PERIOD, type HomeSectionPeriod } from '@tanuki/contracts';
import { getHomeSectionPeriodLabel, parseHomeSectionPeriod } from '../lib';

type Props = {
  value: HomeSectionPeriod;
  onChange: (period: HomeSectionPeriod) => void;
};

/** Период блока (P2) — как `time=` у сайта; на телефоне поле тянется на всю ширину строки. */
function PeriodSelect({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <Select
      aria-label={t('timePeriod')}
      data={Object.values(HOME_SECTION_PERIOD).map((period) => ({
        value: period,
        label: getHomeSectionPeriodLabel(period, t),
      }))}
      value={value}
      onChange={(next) => {
        const period = parseHomeSectionPeriod(next);
        if (period) onChange(period);
      }}
      allowDeselect={false}
      leftSection={<CalendarBlankIcon />}
      w={{ base: '100%', xs: 160 }}
    />
  );
}

export default PeriodSelect;
