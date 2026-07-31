import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { defaultColorScheme, theme } from './theme';

import '@mantine/core/styles.css';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme={defaultColorScheme}>
      {children}
    </MantineProvider>
  );
}
