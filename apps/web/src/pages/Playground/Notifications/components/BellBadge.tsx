import type { ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import { BADGE, type Badge } from '../models';

type Props = {
  variant: Badge;
  count: number;
  /** Десктопная шапка (true) или мобильный футер (false): гибрид различает их. */
  isHeader: boolean;
  children: ReactNode;
};

const MAX_COUNT = 99;

/** Метка непрочитанного на колокольчике: число в красном кружке, точка или гибрид. */
function BellBadge({ variant, count, isHeader, children }: Props) {
  const isDisabled = count === 0;
  const kind = variant === BADGE.HYBRID ? (isHeader ? BADGE.COUNT : BADGE.DOT) : variant;

  switch (kind) {
    case BADGE.NONE:
      return children;
    case BADGE.DOT:
      return (
        <Indicator size={8} offset={2} disabled={isDisabled}>
          {children}
        </Indicator>
      );
    case BADGE.COUNT:
      return (
        <Indicator
          size={16}
          offset={2}
          color="red"
          disabled={isDisabled}
          label={count > MAX_COUNT ? `${MAX_COUNT}+` : count}
          ff="monospace"
          fw={600}
          fz={10}
        >
          {children}
        </Indicator>
      );
  }
}

export default BellBadge;
