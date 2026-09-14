import { Fragment, type ReactNode } from 'react';
import type { BoxProps, GroupProps } from '@mantine/core';
import { Group } from '@mantine/core';
import MidDot from './MidDot';

type Props = {
  items: ReactNode[];
  gap?: GroupProps['gap'];
  mt?: GroupProps['mt'];
  separatorProps?: BoxProps;
};

function MidDotGroup({ items, gap = 4, mt, separatorProps }: Props) {
  const visibleItems = items.filter(
    (item) => item !== null && item !== undefined && item !== false,
  );

  if (!visibleItems.length) {
    return null;
  }

  return (
    <Group gap={gap} mt={mt}>
      {visibleItems.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <MidDot {...separatorProps} />}
          {item}
        </Fragment>
      ))}
    </Group>
  );
}

export default MidDotGroup;
