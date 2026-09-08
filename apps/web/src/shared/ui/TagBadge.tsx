import type { BadgeProps } from '@mantine/core';
import { Badge } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
} & Omit<BadgeProps, 'color' | 'styles'>;

function TagBadge({ children, ...restProps }: Props) {
  return (
    <Badge
      {...restProps}
      color="var(--mantine-color-default-border)"
      fw={400}
      styles={{
        label: {
          color: 'var(--mantine-color-text)',
          textTransform: 'none',
        },
      }}
    >
      {children}
    </Badge>
  );
}

export default TagBadge;
