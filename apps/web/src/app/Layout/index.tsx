import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router';

import Header from './Header';
import Footer from './Footer';
import DevCacheResetButton from './components/DevCacheResetButton';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';

function Layout() {
  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      footer={{ height: { base: HEADER_HEIGHT, md: 0 } }}
    >
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
