import { Box, Button, Group, Stack, Text } from '@mantine/core';
import type { RowProps } from './models';
import styles from './GroupedListRow.module.scss';

type Props = RowProps;

/** Строка GroupedList: иконка, заголовок и пояснение слева, действие справа. */
function GroupedListRow({ title, description, icon, actionProps, action }: Props) {
  return (
    <Box className={styles.row}>
      <Group justify="space-between" gap="md" px="md" py="xs">
        <Group gap="md" wrap="nowrap" flex={1} miw={0}>
          {icon && (
            <Box c="dimmed" fz={24} lh={0}>
              {icon}
            </Box>
          )}
          <Stack gap={4} miw={0}>
            <Text component="div" lh="tight" fz={14}>
              {title}
            </Text>
            {description && (
              <Text component="div" fz={12} c="dimmed" lh="tight">
                {description}
              </Text>
            )}
          </Stack>
        </Group>
        {actionProps && (
          <Button
            {...actionProps}
            className={styles.action}
            variant={actionProps.variant || 'default'}
            size="xs"
          />
        )}
        {action && <Box className={styles.action}>{action}</Box>}
      </Group>
    </Box>
  );
}

export default GroupedListRow;
