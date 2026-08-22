import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { CheckIcon } from '@phosphor-icons/react';
import styles from './../Layout.module.scss';

type Props = {
  to: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
} & Omit<ButtonProps, 'to' | 'variant' | 'children' | 'component'>;

function SourceSelectOption({ label, isActive, ...restProps }: Props) {
  return (
    <Button
      {...restProps}
      data-active={isActive || undefined}
      className={styles.switcherOption}
      component={Link}
      variant="subtle"
      color="gray"
      justify="flex-start"
      fz={16}
      size="md"
      rightSection={isActive && <CheckIcon color="var(--mantine-primary-color-filled)" />}
    >
      {label}
    </Button>
  );
}

export default SourceSelectOption;
