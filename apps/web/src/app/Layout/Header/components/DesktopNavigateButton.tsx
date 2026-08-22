import type { ActionIconProps } from '@mantine/core';
import { ActionIcon } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
} & Omit<ActionIconProps, 'children' | 'size' | 'varian' | 'color'>;

function DesktopNavigateButton({ icon, ...restProps }: Props) {
  return (
    <ActionIcon size="lg" variant="subtle" color="gray" {...restProps}>
      {icon}
    </ActionIcon>
  );
}

export default DesktopNavigateButton;
