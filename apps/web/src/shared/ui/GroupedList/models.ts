import type { ButtonProps, ElementProps, MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';

export type RowProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionProps?: Omit<ButtonProps, 'size'> & ElementProps<'button', keyof ButtonProps>;
  action?: ReactNode;
  color?: MantineColor;
};

/** Сколько строк-скелетонов показать, пока список грузится, если экран не задал своё число. */
export const DEFAULT_SKELETON_ROWS = 3;
