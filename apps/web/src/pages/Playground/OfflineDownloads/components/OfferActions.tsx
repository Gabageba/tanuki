import type { ReactNode } from 'react';
import { Button, Group } from '@mantine/core';
import { ClockIcon } from '@phosphor-icons/react';

type Props = {
  label: string;
  icon: ReactNode;
  size?: 'xs' | 'sm';
  /** Кнопки делят ширину поровну. */
  isFull?: boolean;
};

/** Главное действие и «Не сейчас» — как у предложения push (M3). */
function OfferActions({ label, icon, size = 'xs', isFull = false }: Props) {
  return (
    <Group gap="xs" wrap={isFull ? 'nowrap' : 'wrap'} grow={isFull}>
      <Button size={size} leftSection={icon}>
        {label}
      </Button>
      <Button size={size} variant="subtle" color="gray" leftSection={<ClockIcon />}>
        Не сейчас
      </Button>
    </Group>
  );
}

export default OfferActions;
