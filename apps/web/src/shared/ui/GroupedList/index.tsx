import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Box, Divider, Flex, Paper, Stack, Text, type MantineColor } from '@mantine/core';
import { getMutedBackground, getMutedBorderColor } from '@/shared/lib/palette';
import GroupedListFooter from './GroupedListFooter';
import GroupedListHeader from './GroupedListHeader';
import GroupedListRow from './GroupedListRow';
import GroupedListRowSkeleton from './GroupedListRowSkeleton';
import { DEFAULT_SKELETON_ROWS } from './models';
import styles from './GroupedList.module.scss';

type Props = {
  label: ReactNode;
  /** Едва тонирует рамку этим цветом — фон и границу, например `red` для опасной зоны. */
  color?: MantineColor;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  /** Боковой блок на широком экране; на телефоне располагается над строками. */
  aside?: ReactNode;
  children?: ReactNode;
};

/**
 * Блок экрана настроек: служебная подпись над рамкой, строки внутри разделены линией.
 *
 * `GroupedList.Header` и `GroupedList.Footer` распознаются по типу, поэтому должны быть прямыми
 * детьми — обёрнутые в свой компонент, они попадут в обычные строки. Шапка и подвал видны всегда,
 * а `loading` и `empty` заменяют только строки между ними.
 */
function GroupedList({
  label,
  color,
  loading = false,
  skeletonRows = DEFAULT_SKELETON_ROWS,
  empty,
  aside,
  children,
}: Props) {
  const nodes = Children.toArray(children);
  const header = nodes.find((node) => isValidElement(node) && node.type === GroupedListHeader);
  const footer = nodes.find((node) => isValidElement(node) && node.type === GroupedListFooter);
  const rows = nodes.filter((node) => node !== header && node !== footer);

  const getBody = () => {
    if (loading) {
      return Array.from({ length: skeletonRows }, (_, index) => (
        <GroupedListRowSkeleton key={index} />
      ));
    }
    if (rows.length > 0) return rows;
    if (!empty) return [];
    return [
      typeof empty === 'string' ? (
        <Text fz="sm" c="dimmed" ta="center" px="lg" py="md">
          {empty}
        </Text>
      ) : (
        empty
      ),
    ];
  };

  const items = [header, ...getBody(), footer].filter(Boolean);

  if (items.length === 0 && !aside) return null;

  return (
    <Stack gap="xs">
      <Text component="div" ff="monospace" tt="uppercase" fz={12} c="dimmed" lts={1} lh="tight">
        {label}
      </Text>
      {/* overflow обрезает фон шапки по скруглённым углам рамки. */}
      <Paper
        withBorder
        radius="md"
        bg={color && getMutedBackground(color)}
        style={{
          overflow: 'hidden',
          ...(color && { '--paper-border-color': getMutedBorderColor(color) }),
        }}
      >
        <Flex direction={{ base: 'column', md: 'row' }}>
          {aside && (
            <Box w={{ base: '100%', md: 340 }} flex="none" className={styles.aside}>
              {aside}
            </Box>
          )}
          <Box flex={1} miw={0}>
            {items.map((item, index) => (
              <Fragment key={index}>
                {index > 0 && <Divider />}
                {item}
              </Fragment>
            ))}
          </Box>
        </Flex>
      </Paper>
    </Stack>
  );
}

GroupedList.Header = GroupedListHeader;
GroupedList.Row = GroupedListRow;
GroupedList.Footer = GroupedListFooter;

export default GroupedList;
