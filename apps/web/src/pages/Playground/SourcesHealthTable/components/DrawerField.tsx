import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

type Props = {
  label: string;
  children: ReactNode;
};

/** Копия `DrawerField` из «Управления». Строка «подпись — значение» в карточках пользователя и приглашения. */
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
