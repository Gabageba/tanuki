import { Group } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

function ModalButtonsLayout({ children }: Props) {
  return (
    <Group justify="flex-end" gap="xs">
      {children}
    </Group>
  );
}

export default ModalButtonsLayout;
