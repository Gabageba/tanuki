import { SKIP_WAITING_MESSAGE } from './serviceWorkerConstants';

type Listener = () => void;

let waitingWorker: ServiceWorker | null = null;
const LISTENERS = new Set<Listener>();
let updateRequested = false;

const setWaitingWorker = (worker: ServiceWorker | null) => {
  waitingWorker = worker;
  if (!worker) updateRequested = false;
  LISTENERS.forEach((listener) => listener());
};

/** Новая версия воркера установилась и ждёт: приложение предлагает обновиться, а не обновляется
 *  само — перезагрузка посреди главы теряла бы позицию (registerType: 'prompt', docs/06). */
export const subscribeToUpdate = (listener: Listener) => {
  LISTENERS.add(listener);
  return () => {
    LISTENERS.delete(listener);
  };
};

export const isUpdateAvailable = () => waitingWorker !== null;
export const getWaitingWorker = () => waitingWorker;
export const isUpdateRequested = () => updateRequested;

const setUpdateRequested = (value: boolean) => {
  updateRequested = value;
  LISTENERS.forEach((listener) => listener());
};

/** Ожидающий воркер сам завершает подготовку и активацию, даже если вкладка закроется. */
export const applyUpdate = () => {
  if (!waitingWorker || updateRequested || waitingWorker.state !== 'installed') return;
  setUpdateRequested(true);
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  waitingWorker.postMessage(SKIP_WAITING_MESSAGE);
};

const watchRegistration = (registration: ServiceWorkerRegistration) => {
  const watchWorker = (worker: ServiceWorker) => {
    const update = () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        setWaitingWorker(worker);
      } else if (waitingWorker === worker && worker.state !== 'installed') {
        setWaitingWorker(null);
      }
    };
    worker.addEventListener('statechange', update);
    update();
  };
  // Первая установка ничего не заменяет — ждать ей некого, предлагать нечего.
  if (registration.waiting && navigator.serviceWorker.controller) {
    watchWorker(registration.waiting);
  }
  // Установка могла начаться до завершения register().
  if (registration.installing) watchWorker(registration.installing);
  registration.addEventListener('updatefound', () => {
    if (registration.installing) watchWorker(registration.installing);
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
