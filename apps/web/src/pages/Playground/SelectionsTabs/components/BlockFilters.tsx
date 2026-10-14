import { Group, Scroller, SegmentedControl } from '@mantine/core';
import { isReadingPeriod, READING_PERIOD_OPTIONS } from '../lib';
import type { MockBlock, ReadingPeriod } from '../models';

type Props = {
  block: MockBlock;
  period: ReadingPeriod;
  onPeriodChange: (period: ReadingPeriod) => void;
  variantId: string | undefined;
  onVariantChange: (variantId: string) => void;
};

/**
 * Фильтры над сеткой блока: P1 — только период, P3 — ещё и что внутри слитого блока
 * («Сейчас читают»: новинки / набирающее / популярное). Строка листается вбок на телефоне.
 */
function BlockFilters({ block, period, onPeriodChange, variantId, onVariantChange }: Props) {
  const { variants } = block;

  return (
    <Scroller>
      <Group gap="sm" wrap="nowrap">
        {variants && (
          <SegmentedControl
            size="sm"
            value={variantId ?? variants[0]?.id ?? ''}
            onChange={onVariantChange}
            data={variants.map(({ id, title }) => ({ value: id, label: title }))}
          />
        )}
        <SegmentedControl
          size="sm"
          value={period}
          onChange={(value) => isReadingPeriod(value) && onPeriodChange(value)}
          data={READING_PERIOD_OPTIONS}
        />
      </Group>
    </Scroller>
  );
}

export default BlockFilters;
