import './styles';
import type { ReactNode } from 'react';
import QueryClientProvider from './QueryClientProvider';
import MantineProvider from './MantineProvider';
import RouterProvider from './RouterProvider';
import I18nProvider from './I18nProvider';
import UserSettingsSync from './UserSettingsSync';

type Props = {
  children: ReactNode;
};

function Providers({ children }: Props) {
  return (
    <I18nProvider>
      <QueryClientProvider>
        <MantineProvider>
          <UserSettingsSync />
          {children}
          <RouterProvider />
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default Providers;
