import { Group, Text } from '@mantine/core';
import { FILTER_TYPE, type FilterGroup } from '@tanuki/contracts';

type Props = {
  group: FilterGroup;
};

function CatalogFilterGroupTitle({ group }: Props) {
  return (
    <Group gap={8} align="center">
      <Text fz={14}>{group.title}</Text>
      <Text c="dimmed" fz={12} mt={1}>
        {group.type === FILTER_TYPE.RANGE
          ? `${group.settings?.range.min} - ${group.settings?.range.max}`
          : group.options.length}
      </Text>
    </Group>
  );
}

export default CatalogFilterGroupTitle;
