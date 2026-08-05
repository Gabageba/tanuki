import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/api/query-client';
import { defaultColorScheme, theme } from './theme';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme={defaultColorScheme}>
        <Notifications />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
