import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { getMutedBorderColor } from '@/shared/lib/palette';
import type { RowProps } from './models';

type Props = RowProps & {
  /** Боковой блок: компактные отступы, без нижней линии; с пояснением выравнивается сверху. */
  isAside?: boolean;
};

/**
 * Шапка GroupedList: фон белый, как у строк, а от них её отделяет линия цвета `color` — вместе
 * с общим разделителем она выходит плотнее обычной границы между строками.
 */
function GroupedListHeader({
  icon,
  title,
  description,
  actionProps,
  action,
  color,
  isAside = false,
}: Props) {
  const align = isAside && description ? 'flex-start' : 'center';

  return (
    <Group
      justify="space-between"
      gap={isAside ? 'xs' : 'md'}
      align={align}
      px="md"
      py="xs"
      style={
        color && !isAside
          ? { boxShadow: `inset 0 -1px 0 ${getMutedBorderColor(color, true)}` }
          : undefined
      }
    >
      <Group gap={isAside ? 'xs' : 'md'} wrap="nowrap" align={align} flex={1} miw={0}>
        {icon && (
          <Box c={color || 'dimmed'} fz={24} lh={0} flex="none">
            {icon}
          </Box>
        )}
        <Stack gap={4} miw={0}>
          <Text component="div" lh="tight" fz={14} c={color}>
            {title}
          </Text>
          {description && (
            <Text
              component="div"
              fz={12}
              c="dimmed"
              lh={isAside ? 'tight' : 1.2}
              style={isAside ? { overflowWrap: 'anywhere' } : undefined}
            >
              {description}
            </Text>
          )}
        </Stack>
      </Group>
      {actionProps && (
        <Button {...actionProps} variant={actionProps.variant || 'default'} size="xs" />
      )}
      {action}
    </Group>
  );
}

export default GroupedListHeader;
