import type { DrawerProps } from '@mantine/core';
import { Drawer } from '@mantine/core';
import styles from '../Footer.module.scss';

type Props = Omit<DrawerProps, 'position' | 'size' | 'classNames'>;

function MobileNavigationDrawer({ children, ...restProps }: Props) {
  return (
    <Drawer
      {...restProps}
      position="bottom"
      size="xl"
      classNames={{
        content: styles.sourceSelectDrawerContent,
        body: styles.sourceSelectDrawerBody,
      }}
    >
      {children}
    </Drawer>
  );
}

export default MobileNavigationDrawer;
