import type { ReactNode } from 'react';
import { Button } from '@mantine/core';

type Props = {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
};

/** Пункт мобильного футера: открытый — шире и с подписью, остальные — одна иконка. */
function FooterItemMock({ icon, label, isActive = false }: Props) {
  if (!isActive) {
    return (
      <Button flex={1} variant="subtle" color="gray" px={4} leftSection={icon} aria-label={label} />
    );
  }

  return (
    <Button flex={4} variant="light" px={4} leftSection={icon}>
      {label}
    </Button>
  );
}

export default FooterItemMock;
