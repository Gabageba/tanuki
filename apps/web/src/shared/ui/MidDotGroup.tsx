import { Fragment, type ReactNode } from 'react';
import type { BoxProps, GroupProps, MantineStyleProps, TextProps } from '@mantine/core';
import { Box, Group, Space, Text } from '@mantine/core';
import CollapsibleGroup from './CollapsibleGroup';
import MidDot from './MidDot';

const TRUNCATE_STYLE = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

type Props = {
  items: ReactNode[];
  gap?: GroupProps['gap'];
  mt?: MantineStyleProps['mt'];
  maxRows?: number;
  separatorProps?: BoxProps;
  text?: TextProps | boolean;
  lh?: MantineStyleProps['lh'];
  truncate?: boolean;
};

function MidDotGroup({
  items,
  gap = 4,
  mt,
  maxRows,
  separatorProps = {},
  text,
  lh,
  truncate,
}: Props) {
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
      <Text span {...(typeof text === 'object' ? text : {})} lh={lh}>
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
      <CollapsibleGroup gap={gap} mt={mt} maxRows={maxRows} lh={lh}>
        {children}
      </CollapsibleGroup>
    );
  }

  return (
    <Box mt={mt} lh={lh} style={truncate ? TRUNCATE_STYLE : undefined}>
      {visibleItems.map((item, index) => (
        <Fragment key={index}>
          {renderItem(item)}
          {index < visibleItems.length - 1 && (
            <>
              <Space w={gap} display="inline-block" />
              <MidDot {...separatorProps} />
              <Space w={gap} display="inline-block" />
              {!truncate && <wbr />}
            </>
          )}
        </Fragment>
      ))}
    </Box>
  );
}

export default MidDotGroup;
