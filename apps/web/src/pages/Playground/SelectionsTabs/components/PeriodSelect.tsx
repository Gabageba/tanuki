import { Select } from '@mantine/core';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import { isReadingPeriod, READING_PERIOD_OPTIONS } from '../lib';
import type { ReadingPeriod } from '../models';

type Props = {
  value: ReadingPeriod;
  onChange: (period: ReadingPeriod) => void;
  /** Итог на телефоне — поле на всю ширину строки, вид справа. */
  fullWidth?: boolean;
};

/** P2 — период полем в строке «Каталог / вид»; появляется только у блоков с периодом. */
function PeriodSelect({ value, onChange, fullWidth = false }: Props) {
  return (
    <Select
      aria-label="Период"
      data={READING_PERIOD_OPTIONS}
      value={value}
      onChange={(next) => next && isReadingPeriod(next) && onChange(next)}
      allowDeselect={false}
      leftSection={<CalendarBlankIcon />}
      w={fullWidth ? '100%' : 150}
      flex={fullWidth ? 1 : 'none'}
    />
  );
}

export default PeriodSelect;
