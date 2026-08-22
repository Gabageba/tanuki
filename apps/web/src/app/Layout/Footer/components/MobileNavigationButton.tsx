import type { ButtonProps } from '@mantine/core';
import { Button, Typography } from '@mantine/core';
import styles from './../Footer.module.scss';

type Props = {
  title: string;
  isActive?: boolean;
  onClick: () => void;
} & Omit<ButtonProps, 'children' | 'flex' | 'className'>;

function MobileNavigationButton({ title, isActive = false, ...restProps }: Props) {
  return (
    <Button
      {...restProps}
      flex={{ base: isActive ? 4 : 1, sm: 1 }}
      data-active={isActive || undefined}
      variant="subtle"
      color="gray"
      px={{ base: 4, sm: 16 }}
      className={styles.navigationButton}
    >
      <Typography className={styles.navigationButtonLabel}>{title}</Typography>
    </Button>
  );
}

export default MobileNavigationButton;
