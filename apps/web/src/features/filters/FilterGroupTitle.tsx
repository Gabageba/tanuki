import { Group, Text } from '@mantine/core';
import {
  FILTER_TYPE,
  RANGE_FORMAT,
  formatCompactNumber,
  type FilterGroup,
  type RangeFormat,
} from '@tanuki/contracts';

type Props = {
  group: FilterGroup;
};

const formatRangeTitle = (min: number, max: number, format: RangeFormat | undefined) => {
  if (format === RANGE_FORMAT.YEAR) return `${min} - ${max}`;

  const compactMin = formatCompactNumber(min);
  const compactMax = formatCompactNumber(max);
  return compactMin === compactMax ? `${min} - ${max}` : `${compactMin} - ${compactMax}`;
};

function FilterGroupTitle({ group }: Props) {
  return (
    <Group gap={8} align="center">
      <Text fz={14}>{group.title}</Text>
      <Text c="dimmed" fz={12} mt={1}>
        {group.type === FILTER_TYPE.RANGE
          ? formatRangeTitle(
              group.settings?.range.min ?? 0,
              group.settings?.range.max ?? 0,
              group.settings?.range.format,
            )
          : group.options.length}
      </Text>
    </Group>
  );
}

export default FilterGroupTitle;
