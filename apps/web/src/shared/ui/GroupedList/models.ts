import type { ButtonProps, ElementProps, MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';

export type RowProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionProps?: Omit<ButtonProps, 'size'> & ElementProps<'button', keyof ButtonProps>;
  action?: ReactNode;
  /** Действие узкое (число, значок): на телефоне остаётся справа, а не уходит под текст. */
  isActionCompact?: boolean;
  /** Под заголовком, с отступом по тексту: ползунок, схема, пресеты. */
  children?: ReactNode;
  /** Строка сейчас не действует и гаснет; почему — должно говорить её описание. */
  disabled?: boolean;
  color?: MantineColor;
};

/** Сколько строк-скелетонов показать, пока список грузится, если экран не задал своё число. */
export const DEFAULT_SKELETON_ROWS = 3;
