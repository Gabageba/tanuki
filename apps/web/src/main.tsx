import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Notifications } from '@mantine/notifications';
import Providers from './app/Providers';
import { registerServiceWorker } from './shared/lib/serviceWorker';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

registerServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <Notifications />
    </Providers>
  </StrictMode>,
);
