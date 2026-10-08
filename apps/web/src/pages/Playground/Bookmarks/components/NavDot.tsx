import type { ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import { DOT_VARIANT, type DotVariant } from '../models';
import styles from '../Bookmarks.module.scss';

type Props = {
  variant: DotVariant;
  /** Сколько закладок с новыми главами; 0 — точки нет. */
  count: number;
  children: ReactNode;
};

/** Точка «есть новые главы» на иконке закладок в шапке и футере. */
function NavDot({ variant, count, children }: Props) {
  const isDisabled = count === 0;

  switch (variant) {
    case DOT_VARIANT.DOT:
      return (
        <Indicator size={8} offset={2} disabled={isDisabled}>
          {children}
        </Indicator>
      );
    case DOT_VARIANT.CUTOUT:
      return (
        <Indicator
          size={10}
          offset={2}
          disabled={isDisabled}
          classNames={{ indicator: styles.cutoutDot }}
        >
          {children}
        </Indicator>
      );
    case DOT_VARIANT.COUNT:
      return (
        <Indicator
          size={16}
          offset={2}
          disabled={isDisabled}
          label={count}
          ff="monospace"
          fw={600}
          fz={10}
          classNames={{ indicator: styles.cutoutDot }}
        >
          {children}
        </Indicator>
      );
  }
}

export default NavDot;
