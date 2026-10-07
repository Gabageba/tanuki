import type { ReactNode } from 'react';
import { ActionIcon } from '@mantine/core';

type Props = {
  icon: ReactNode;
};

/** Неактивная кнопка нижней панели на узком экране — только иконка. */
function FooterIdleButton({ icon }: Props) {
  return (
    <ActionIcon flex={1} w="auto" h={36} variant="subtle" color="gray">
      {icon}
    </ActionIcon>
  );
}

export default FooterIdleButton;
