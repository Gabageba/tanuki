import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';

type Props = {
  label: string;
  extra: string;
  children: ReactNode;
};

/** Рамка карточки статистики профиля — копия `ProfileStatisticCard`: импорт из другой страницы
 *  запрещён линтом. */
function ProfileCardFrame({ label, extra, children }: Props) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="lg" h="100%">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text fw={600} fz={16}>
            {label}
          </Text>
          <Text fz={12} c="dimmed" ta="right">
            {extra}
          </Text>
        </Group>
        <Box flex={1}>{children}</Box>
      </Stack>
    </Paper>
  );
}

export default ProfileCardFrame;
