import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

type Props = {
  label: string;
  children: ReactNode;
};

/** Строка «подпись — значение» — копия из карточки пользователя. */
function DrawerField({ label, children }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Text fz="sm" c="dimmed" flex="none">
        {label}
      </Text>
      <Stack gap={2} align="flex-end" miw={0} ta="right">
        {children}
      </Stack>
    </Group>
  );
}

export default DrawerField;
