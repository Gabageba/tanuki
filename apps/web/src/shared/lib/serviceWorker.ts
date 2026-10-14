import { SKIP_WAITING_MESSAGE } from './serviceWorkerConstants';

type Listener = () => void;

let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<Listener>();

const setWaitingWorker = (worker: ServiceWorker | null) => {
  waitingWorker = worker;
  listeners.forEach((listener) => listener());
};

/** Новая версия воркера установилась и ждёт: приложение предлагает обновиться, а не обновляется
 *  само — перезагрузка посреди главы теряла бы позицию (registerType: 'prompt', docs/06). */
export const subscribeToUpdate = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const isUpdateAvailable = () => waitingWorker !== null;

/** Применяет обновление: ожидающий воркер активируется, страница перезагружается на новую версию. */
export const applyUpdate = () => {
  if (!waitingWorker) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  waitingWorker.postMessage(SKIP_WAITING_MESSAGE);
};

const watchRegistration = (registration: ServiceWorkerRegistration) => {
  // Первая установка ничего не заменяет — ждать ей некого, предлагать нечего.
  if (registration.waiting && navigator.serviceWorker.controller) {
    setWaitingWorker(registration.waiting);
  }
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        setWaitingWorker(installing);
      }
    });
  });
};

/** Воркер держит push, кеш и скачивание глав; в браузерах без него приложение работает онлайн. */
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  // В dev воркер отдаёт vite-plugin-pwa (devOptions), в сборке — готовый /sw.js.
  const register = import.meta.env.DEV
    ? navigator.serviceWorker.register('/dev-sw.js?dev-sw', { type: 'module' })
    : navigator.serviceWorker.register('/sw.js');
  register.then(watchRegistration).catch(() => undefined);
};

/** Сообщение активному воркеру. Пока его нет (первая установка), сообщение ждёт готовности. */
export const postServiceWorkerMessage = (message: unknown) => {
  if (!('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.ready.then((registration) =>
    registration.active?.postMessage(message),
  );
};

/** Страница под воркером: адреса, которые отдаёт только он (скачанные страницы), откроются. */
export const isServiceWorkerControlling = () =>
  'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
