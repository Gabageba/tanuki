import type { ReactNode } from 'react';
import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { ROW_CONTENT_OFFSET } from '../models';

type Props = {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Действие широкое (сегменты, поле): на телефоне уходит под текст на всю ширину. Компактное
   *  (тумблер, число) остаётся справа. */
  isActionWide?: boolean;
  /** Под заголовком, с отступом по тексту: ползунок, схема, пресеты. */
  children?: ReactNode;
  disabled?: boolean;
  /** Подсказка при наведении на погашенную строку (D3). */
  tooltip?: string;
  narrow: boolean;
};

/**
 * Строка GroupedList с местом под содержимое снизу и погашенным состоянием. У GroupedList.Row
 * ни того, ни другого нет, а перенос действия там смотрит на окно, а не на рамку телефона.
 */
function SettingRow({
  icon,
  title,
  description,
  action,
  isActionWide = false,
  children,
  disabled = false,
  tooltip,
  narrow,
}: Props) {
  const isActionBelow = narrow && isActionWide;

  const row = (
    <Stack gap="xs" px="md" py="xs" opacity={disabled ? 0.5 : 1}>
      <Group justify="space-between" gap="md" wrap={isActionBelow ? 'wrap' : 'nowrap'}>
        <Group gap="md" wrap="nowrap" flex={1} miw={0}>
          <Box c="dimmed" fz={24} lh={0}>
            {icon}
          </Box>
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
        {action && (
          <Box
            flex={isActionBelow ? '0 0 100%' : 'none'}
            pl={isActionBelow ? ROW_CONTENT_OFFSET : 0}
          >
            {action}
          </Box>
        )}
      </Group>
      {children && (
        <Stack gap="xs" pl={ROW_CONTENT_OFFSET}>
          {children}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Tooltip
      label={tooltip}
      disabled={!tooltip || !disabled}
      position="top-start"
      multiline
      maw={260}
    >
      <Box>{row}</Box>
    </Tooltip>
  );
}

export default SettingRow;
