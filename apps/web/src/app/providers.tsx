import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/api/query-client';
import { defaultColorScheme, theme } from './theme';

import '@mantine/core/styles.css';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme={defaultColorScheme}>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
