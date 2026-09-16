import { Fragment, type ReactNode } from 'react';
import type { BoxProps, GroupProps, TextProps } from '@mantine/core';
import { Box, Group, Space, Text } from '@mantine/core';
import CollapsibleGroup from './CollapsibleGroup';
import MidDot from './MidDot';

type Props = {
  items: ReactNode[];
  gap?: GroupProps['gap'];
  mt?: GroupProps['mt'];
  maxRows?: number;
  separatorProps?: BoxProps;
  text?: TextProps | boolean;
};

function MidDotGroup({ items, gap = 4, mt, maxRows, separatorProps = {}, text }: Props) {
  const visibleItems = items.filter(
    (item) => item !== null && item !== undefined && item !== false,
  );

  if (!visibleItems.length) {
    return null;
  }

  const renderItem = (item: ReactNode) => {
    const content =
      typeof item === 'string' || typeof item === 'number' ? (
        item
      ) : (
        <Box component="span" display="inline-flex">
          {item}
        </Box>
      );

    return text ? (
      <Text span {...(typeof text === 'object' ? text : {})}>
        {content}
      </Text>
    ) : (
      content
    );
  };

  if (maxRows) {
    const children = visibleItems.map((item, index) => (
      <Group key={index} gap={gap} wrap="nowrap" align="flex-start">
        {renderItem(item)}
        {index < visibleItems.length - 1 && <MidDot {...separatorProps} />}
      </Group>
    ));

    return (
      <CollapsibleGroup gap={gap} mt={mt} maxRows={maxRows}>
        {children}
      </CollapsibleGroup>
    );
  }

  return (
    <Box mt={mt}>
      {visibleItems.map((item, index) => (
        <Fragment key={index}>
          {renderItem(item)}
          {index < visibleItems.length - 1 && (
            <>
              <Space w={gap} display="inline-block" />
              <MidDot {...separatorProps} />
              <Space w={gap} display="inline-block" />
              <wbr />
            </>
          )}
        </Fragment>
      ))}
    </Box>
  );
}

export default MidDotGroup;
