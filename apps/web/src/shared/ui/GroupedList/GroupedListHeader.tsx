import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { getMutedBorderColor } from '@/shared/lib/palette';
import type { RowProps } from './models';

type Props = RowProps;

/**
 * Шапка GroupedList: фон белый, как у строк, а от них её отделяет линия цвета `color` — вместе
 * с общим разделителем она выходит плотнее обычной границы между строками.
 */
function GroupedListHeader({ icon, title, description, actionProps, action, color }: Props) {
  return (
    <Group
      justify="space-between"
      gap="md"
      px="md"
      py="xs"
      style={color && { boxShadow: `inset 0 -1px 0 ${getMutedBorderColor(color, true)}` }}
    >
      <Group gap="md" wrap="nowrap" flex={1} miw={0}>
        {icon && (
          <Box c={color || 'dimmed'} fz={24} lh={0}>
            {icon}
          </Box>
        )}
        <Stack gap={4} miw={0}>
          <Text component="div" lh="tight" fz={14} c={color}>
            {title}
          </Text>
          {description && (
            <Text component="div" fz={12} c={'dimmed'} lh={1.2}>
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
