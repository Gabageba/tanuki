import { fn } from 'storybook/test';
import { registerInstallPrompt } from '@/shared/lib/appInstall/install';
import { registerServiceWorker } from '@/shared/lib/serviceWorker';

/** Одноразовое событие Chromium и ожидающий SW без регистрации настоящего PWA поверх MSW. */
export const preparePwaOffers = async () => {
  const stopInstall = registerInstallPrompt();
  window.dispatchEvent(
    Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    }),
  );

  const worker = Object.assign(new EventTarget(), { state: 'installed', postMessage: fn() });
  const registration = Object.assign(new EventTarget(), { waiting: worker, installing: null });
  const serviceWorker = navigator.serviceWorker;
  const controller = Object.getOwnPropertyDescriptor(serviceWorker, 'controller');
  const register = Object.getOwnPropertyDescriptor(serviceWorker, 'register');
  Object.defineProperty(serviceWorker, 'controller', { configurable: true, value: worker });
  Object.defineProperty(serviceWorker, 'register', {
    configurable: true,
    value: () => Promise.resolve(registration),
  });
  registerServiceWorker();
  await Promise.resolve();
  if (controller) Object.defineProperty(serviceWorker, 'controller', controller);
  else Reflect.deleteProperty(serviceWorker, 'controller');
  if (register) Object.defineProperty(serviceWorker, 'register', register);
  else Reflect.deleteProperty(serviceWorker, 'register');

  return () => {
    stopInstall();
    worker.state = 'redundant';
    worker.dispatchEvent(new Event('statechange'));
  };
};
