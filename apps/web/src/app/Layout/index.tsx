import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router';

import Header from './Header';
import Footer from './Footer';
import DevCacheResetButton from './components/DevCacheResetButton';

function Layout() {
  return (
    <AppShell header={{ height: 56 }} footer={{ height: { base: 56, md: 0 } }}>
      <Header />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <Footer />
      {import.meta.env.DEV && <DevCacheResetButton />}
    </AppShell>
  );
}

export default Layout;
