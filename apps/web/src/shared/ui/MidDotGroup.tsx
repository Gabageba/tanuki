import { Fragment, type ReactNode } from 'react';
import type { BoxProps, GroupProps, TextProps } from '@mantine/core';
import { Group, Text } from '@mantine/core';
import MidDot from './MidDot';

type Props = {
  items: ReactNode[];
  gap?: GroupProps['gap'];
  mt?: GroupProps['mt'];
  separatorProps?: BoxProps;
  text?: TextProps | boolean;
};

function MidDotGroup({ items, gap = 4, mt, separatorProps = {}, text }: Props) {
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
          {text ? <Text {...(typeof text === 'object' ? text : {})}>{item}</Text> : item}
        </Fragment>
      ))}
    </Group>
  );
}

export default MidDotGroup;
