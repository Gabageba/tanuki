import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router';

import Header from './Header';

function Layout() {
  return (
    <AppShell header={{ height: 56 }}>
      <Header />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;
