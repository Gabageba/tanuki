import type { DrawerProps } from '@mantine/core';
import { Drawer } from '@mantine/core';

type Props = Omit<DrawerProps, 'position' | 'size' | 'classNames'>;

function MobileNavigationDrawer({ children, ...restProps }: Props) {
  return (
    <Drawer {...restProps} position="bottom" size="xl">
      {children}
    </Drawer>
  );
}

export default MobileNavigationDrawer;
