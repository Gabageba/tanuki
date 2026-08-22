import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Notifications } from '@mantine/notifications';
import Providers from './app/Providers';
import './styles/global.scss';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <Notifications />
    </Providers>
  </StrictMode>,
);
