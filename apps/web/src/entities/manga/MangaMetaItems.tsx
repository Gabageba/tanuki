import type { ReactNode } from 'react';
import type { GroupProps } from '@mantine/core';
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
      text={{
        c: 'dimmed',
        fz: 12,
        lh: 1,
      }}
      items={items}
    />
  );
}

export default MangaMetaItems;
