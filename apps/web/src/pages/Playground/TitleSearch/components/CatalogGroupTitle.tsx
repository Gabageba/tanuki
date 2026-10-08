import { Group, Text } from '@mantine/core';
import type { SearchFilterGroup } from '../models';

type Props = {
  group: SearchFilterGroup;
};

/** Название группы и сколько в ней вариантов — копия `CatalogFilterGroupTitle`. */
function CatalogGroupTitle({ group }: Props) {
  return (
    <Group gap={8} align="center">
      <Text fz={14}>{group.title}</Text>
      <Text c="dimmed" fz={12} mt={1}>
        {group.options.length}
      </Text>
    </Group>
  );
}

export default CatalogGroupTitle;
