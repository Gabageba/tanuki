import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppToastHost from './app/Toasts/AppToastHost';
import Providers from './app/Providers';
import { registerServiceWorker } from './shared/lib/serviceWorker';
import { registerInstallPrompt } from './shared/lib/appInstall/install';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

registerInstallPrompt();
registerServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <AppToastHost />
    </Providers>
  </StrictMode>,
);
