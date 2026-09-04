import { Fragment, type ReactNode } from 'react';
import type { GroupProps } from '@mantine/core';
import { Group, Text } from '@mantine/core';
import MidDot from '@/shared/ui/MidDot';

type Props = {
  items: ReactNode[];
  gap: GroupProps['gap'];
};

function MangaMetaItems({ items, gap }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <Group gap={gap}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <Text c="dimmed" fz={12} lh={1}>
              <MidDot />
            </Text>
          )}
          <Text c="dimmed" fz={12} lh={1}>
            {item}
          </Text>
        </Fragment>
      ))}
    </Group>
  );
}

export default MangaMetaItems;
