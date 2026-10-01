import { Box, Button, Group, Stack, Text } from '@mantine/core';
import type { RowProps } from './models';
import styles from './GroupedListRow.module.scss';

type Props = RowProps;

/** Отступ содержимого под заголовком: иконка 24px плюс gap md — оно встаёт ровно под текст. */
const CONTENT_OFFSET = 40;

/** Строка GroupedList: иконка, заголовок и пояснение слева, действие справа, содержимое снизу. */
function GroupedListRow({
  title,
  description,
  icon,
  actionProps,
  action,
  isActionCompact = false,
  children,
  disabled = false,
}: Props) {
  return (
    <Stack gap="xs" px="md" py="xs" opacity={disabled ? 0.5 : undefined}>
      <Group justify="space-between" gap="md">
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
        {action && (
          <Box className={styles.action} data-compact={isActionCompact || undefined}>
            {action}
          </Box>
        )}
      </Group>
      {children && (
        <Stack gap="xs" pl={icon ? CONTENT_OFFSET : 0}>
          {children}
        </Stack>
      )}
    </Stack>
  );
}

export default GroupedListRow;
