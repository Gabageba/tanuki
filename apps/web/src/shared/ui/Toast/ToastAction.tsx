import type { ReactNode } from 'react';
import { Button } from '@mantine/core';
import styles from './Toast.module.scss';

type Props = {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
};

function ToastAction({ children, icon, onClick }: Props) {
  return (
    <Button
      size="compact-sm"
      variant="default"
      leftSection={icon}
      onClick={onClick}
      mih={30}
      h="auto"
      py={3}
      className={styles.action}
    >
      {children}
    </Button>
  );
}

export default ToastAction;
