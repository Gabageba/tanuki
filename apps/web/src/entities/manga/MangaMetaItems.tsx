import type { ReactNode } from 'react';
import type { GroupProps } from '@mantine/core';
import { Text } from '@mantine/core';
import MidDotGroup from '@/shared/ui/MidDotGroup';

type Props = {
  items: ReactNode[];
  gap: GroupProps['gap'];
};

function MangaMetaItems({ items, gap }: Props) {
  return (
    <MidDotGroup
      gap={gap}
      separatorProps={{ c: 'dimmed', fz: 12, lh: 1 }}
      items={items.map((item, index) => (
        <Text key={index} c="dimmed" fz={12} lh={1}>
          {item}
        </Text>
      ))}
    />
  );
}

export default MangaMetaItems;
