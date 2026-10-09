import type { ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import useUnreadNotificationsCount from './hooks/useUnreadNotificationsCount';

type Props = {
  children: ReactNode;
};

/** Точка на колокольчике, пока есть непрочитанное: 8 px, без числа и без обводки, как у закладок. */
function UnreadNotificationsIndicator({ children }: Props) {
  const { data: count = 0 } = useUnreadNotificationsCount();

  return (
    <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={count === 0}>
      {children}
    </Indicator>
  );
}

export default UnreadNotificationsIndicator;
