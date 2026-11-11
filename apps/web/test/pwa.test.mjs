import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createServer } from 'vite';

const { URL, Event, EventTarget } = globalThis;

let server;
let moduleId = 0;
const ORIGINAL_NAVIGATOR = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

before(async () => {
  server = await createServer({
    configFile: false,
    root: new URL('..', import.meta.url).pathname,
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
    logLevel: 'silent',
  });
});

after(async () => {
  await server.close();
  Object.defineProperty(globalThis, 'navigator', ORIGINAL_NAVIGATOR);
  delete globalThis.window;
  delete globalThis.localStorage;
});

const loadModule = (path) => server.ssrLoadModule(`/src/shared/lib/${path}?test=${moduleId++}`);

const setupInstall = async ({ standalone = false, storage = new Map() } = {}) => {
  const media = Object.assign(new EventTarget(), { matches: standalone });
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => media });
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const install = await loadModule('appInstall/install.ts');
  const stop = install.registerInstallPrompt();
  return { install, stop, storage };
};

const dispatchInstall = (outcome = 'dismissed') => {
  let promptCalls = 0;
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: () => {
      promptCalls++;
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome }),
  });
  globalThis.window.dispatchEvent(event);
  return { event, promptCalls: () => promptCalls };
};

test('установка отложена до двух разных глав, повтор одной главы не считается', async () => {
  const { install, stop } = await setupInstall();
  const prompt = dispatchInstall();
  assert.equal(prompt.event.defaultPrevented, true);
  assert.equal(install.canInstallApp(), true);
  assert.equal(install.shouldOfferInstall(), false);
  install.recordCompletedChapter('title', 'one');
  install.recordCompletedChapter('title', 'one');
  assert.equal(install.shouldOfferInstall(), false);
  install.recordCompletedChapter('title', 'two');
  assert.equal(install.shouldOfferInstall(), true);
  assert.equal(prompt.promptCalls(), 0);
  await install.installApp();
  await install.installApp();
  assert.equal(prompt.promptCalls(), 1);
  assert.equal(install.canInstallApp(), false);
  stop();
});

test('дочитанные главы переживают перезапуск, «Не сейчас» оставляет установку в меню', async () => {
  const first = await setupInstall();
  first.install.recordCompletedChapter('title', 'one');
  first.stop();
  const second = await setupInstall({ storage: first.storage });
  dispatchInstall();
  second.install.recordCompletedChapter('title', 'two');
  assert.equal(second.install.shouldOfferInstall(), true);
  second.install.dismissInstallOffer();
  assert.equal(second.install.shouldOfferInstall(), false);
  assert.equal(second.install.canInstallApp(), true);
  second.stop();
  const third = await setupInstall({ storage: first.storage });
  dispatchInstall();
  assert.equal(third.install.shouldOfferInstall(), false);
  assert.equal(third.install.canInstallApp(), true);
  third.stop();
});

test('установка из меню доступна до двух глав; appinstalled убирает действие', async () => {
  const { install, stop } = await setupInstall();
  const prompt = dispatchInstall('accepted');
  await install.installApp();
  assert.equal(prompt.promptCalls(), 1);
  assert.equal(install.canInstallApp(), false);
  globalThis.window.dispatchEvent(new Event('appinstalled'));
  assert.equal(install.shouldOfferInstall(), false);
  stop();
});

test('standalone и недоступный localStorage не ломают приложение', async () => {
  const { install, stop } = await setupInstall({ standalone: true });
  globalThis.localStorage.getItem = () => {
    throw new Error('Storage blocked');
  };
  globalThis.localStorage.setItem = () => {
    throw new Error('Storage blocked');
  };
  dispatchInstall();
  install.recordCompletedChapter('title', 'one');
  install.recordCompletedChapter('title', 'two');
  assert.equal(install.canInstallApp(), false);
  assert.equal(install.shouldOfferInstall(), false);
  stop();
});

const createWorker = (state) => {
  const messages = [];
  return Object.assign(new EventTarget(), {
    state,
    messages,
    postMessage: (message) => messages.push(message),
  });
};

const setupUpdate = async ({
  controller = createWorker('activated'),
  waiting = null,
  installing = null,
} = {}) => {
  const registration = Object.assign(new EventTarget(), { waiting, installing });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller,
    register: async () => registration,
  });
  let reloads = 0;
  globalThis.window = {
    location: {
      reload: () => {
        reloads++;
      },
    },
  };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { serviceWorker },
  });
  const update = await loadModule('serviceWorker.ts');
  update.registerServiceWorker();
  await setImmediate();
  return { update, registration, serviceWorker, reloads: () => reloads };
};

const setWorkerState = (worker, state) => {
  worker.state = state;
  worker.dispatchEvent(new Event('statechange'));
};

test('первая установка не предлагает обновление', async () => {
  const installing = createWorker('installing');
  const { update } = await setupUpdate({ controller: null, installing });
  setWorkerState(installing, 'installed');
  assert.equal(update.isUpdateAvailable(), false);
});

test('обновление обнаруживается и до подписки, и через updatefound; устаревший пункт исчезает', async () => {
  const waiting = createWorker('installed');
  const { update, registration } = await setupUpdate({ waiting });
  assert.equal(update.getWaitingWorker(), waiting);
  assert.deepEqual(waiting.messages, []);
  const next = createWorker('installing');
  registration.installing = next;
  registration.dispatchEvent(new Event('updatefound'));
  setWorkerState(next, 'installed');
  assert.equal(update.getWaitingWorker(), next);
  setWorkerState(waiting, 'redundant');
  assert.equal(update.getWaitingWorker(), next);
  setWorkerState(next, 'activating');
  assert.equal(update.isUpdateAvailable(), false);
});

test('обновление запрашивается один раз и перезагружает только по controllerchange', async () => {
  const waiting = createWorker('installed');
  const { update, serviceWorker, reloads } = await setupUpdate({ waiting });
  update.applyUpdate();
  update.applyUpdate();
  assert.equal(update.isUpdateRequested(), true);
  assert.deepEqual(waiting.messages, ['skipWaiting']);
  assert.equal(reloads(), 0);
  serviceWorker.dispatchEvent(new Event('controllerchange'));
  serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads(), 1);
});
