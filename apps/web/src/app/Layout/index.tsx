import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router';

import Header from './Header';
import Footer from './Footer';
import DevCacheResetButton from './components/DevCacheResetButton';
import OfflineStrip from './components/OfflineStrip';
import { APP_SHELL_FOOTER, APP_SHELL_HEADER } from '@/shared/lib/appShell';

function Layout() {
  return (
    <AppShell header={APP_SHELL_HEADER} footer={APP_SHELL_FOOTER}>
      <Header />
      <AppShell.Main>
        <OfflineStrip />
        <Outlet />
      </AppShell.Main>
      <Footer />
      {import.meta.env.DEV && <DevCacheResetButton />}
    </AppShell>
  );
}

export default Layout;
