import type { ReactNode } from 'react';
import { Group } from '@mantine/core';

type Props = {
  children: ReactNode;
};

/** Подвал GroupedList: действия над всей группой, прижаты вправо и всегда стоят последними. */
function GroupedListFooter({ children }: Props) {
  return (
    <Group justify="flex-end" px="md" py="xs">
      {children}
    </Group>
  );
}

export default GroupedListFooter;
