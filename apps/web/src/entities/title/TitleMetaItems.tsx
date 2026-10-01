import type { ReactNode } from 'react';
import type { GroupProps } from '@mantine/core';
import MidDotGroup from '@/shared/ui/MidDotGroup';

type Props = {
  items: ReactNode[];
  gap: GroupProps['gap'];
};

function TitleMetaItems({ items, gap }: Props) {
  return (
    <MidDotGroup
      gap={gap}
      separatorProps={{ c: 'dimmed', fz: 12, lh: 'tight' }}
      text={{
        c: 'dimmed',
        fz: 12,
        lh: 'tight',
      }}
      items={items}
    />
  );
}

export default TitleMetaItems;
