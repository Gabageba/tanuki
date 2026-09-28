import type { ReactNode } from 'react';
import { Paper, Stack, Text } from '@mantine/core';

type Props = {
  width: number;
  children: ReactNode;
};

/** Карточка «Прочитано глав» в режиме «Месяц» — без переключателя и футера, только график. */
function DemoCard({ width, children }: Props) {
  return (
    <Paper withBorder radius="md" p="lg" w={width} maw="100%">
      <Stack gap="lg">
        <Text fw={600} fz={16}>
          Прочитано глав
        </Text>
        {children}
      </Stack>
    </Paper>
  );
}

export default DemoCard;
