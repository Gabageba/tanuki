import { Group, Text } from '@mantine/core';
import { FILTER_TYPE, formatCompactNumber, type FilterGroup } from '@tanuki/contracts';

type Props = {
  group: FilterGroup;
};

function CatalogFilterGroupTitle({ group }: Props) {
  return (
    <Group gap={8} align="center">
      <Text fz={14}>{group.title}</Text>
      <Text c="dimmed" fz={12} mt={1}>
        {group.type === FILTER_TYPE.RANGE
          ? `${formatCompactNumber(group.settings?.range.min ?? 0)} - ${formatCompactNumber(group.settings?.range.max ?? 0)}`
          : group.options.length}
      </Text>
    </Group>
  );
}

export default CatalogFilterGroupTitle;
