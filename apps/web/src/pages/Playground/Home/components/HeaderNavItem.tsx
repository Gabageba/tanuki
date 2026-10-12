import type { ReactNode } from 'react';
import { Box } from '@mantine/core';

type Props = {
  isActive: boolean;
  children: ReactNode;
};

/** H4 — пункт навигации в шапке: активный подчёркнут акцентной линией по низу шапки. */
function HeaderNavItem({ isActive, children }: Props) {
  return (
    <Box
      h="100%"
      display="flex"
      style={{
        alignItems: 'center',
        borderBottom: `2px solid ${isActive ? 'var(--mantine-primary-color-filled)' : 'transparent'}`,
      }}
    >
      {children}
    </Box>
  );
}

export default HeaderNavItem;
