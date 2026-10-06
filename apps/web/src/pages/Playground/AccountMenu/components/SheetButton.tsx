import type { ReactNode } from 'react';
import { Button } from '@mantine/core';

type Props = {
  leftSection: ReactNode;
  children: ReactNode;
  isDanger?: boolean;
};

/** Пункт мобильного меню — tile-кнопка во всю ширину, как в нынешнем drawer. */
function SheetButton({ leftSection, children, isDanger = false }: Props) {
  return (
    <Button
      variant="tile"
      justify="flex-start"
      size="md"
      fullWidth
      c={isDanger ? 'red' : undefined}
      leftSection={leftSection}
    >
      {children}
    </Button>
  );
}

export default SheetButton;
