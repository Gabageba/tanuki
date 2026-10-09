import { Group, Scroller, SegmentedControl, Text } from '@mantine/core';
import { getCategoryIcon, getCategoryLabel } from '../lib';
import type { MockCategory } from '../models';

type Props = {
  categories: MockCategory[];
  selected: MockCategory[];
  onChange: (selected: MockCategory[]) => void;
  /** Сколько непрочитанного в каждой категории. */
  counts: Partial<Record<MockCategory, number>>;
  total: number;
};

const ALL = 'all';

/** F3: сегменты по одной категории, у каждой — число непрочитанных. */
function FilterSegments({ categories, selected, onChange, counts, total }: Props) {
  const value = selected[0] ?? ALL;

  return (
    <Scroller flex={1} miw={0}>
      <SegmentedControl
        value={value}
        onChange={(next) => onChange(categories.filter((category) => category === next))}
        data={[
          {
            value: ALL,
            label: (
              <Group gap={6} wrap="nowrap">
                <Text fz="sm" inherit>
                  Все
                </Text>
                <Text fz="xs" ff="monospace" c="dimmed" inherit>
                  {total}
                </Text>
              </Group>
            ),
          },
          ...categories.map((category) => ({
            value: category,
            label: (
              <Group gap={6} wrap="nowrap">
                {getCategoryIcon(category, 14)}
                <Text fz="sm" inherit>
                  {getCategoryLabel(category)}
                </Text>
                <Text fz="xs" ff="monospace" c="dimmed" inherit>
                  {counts[category] ?? 0}
                </Text>
              </Group>
            ),
          })),
        ]}
      />
    </Scroller>
  );
}

export default FilterSegments;
