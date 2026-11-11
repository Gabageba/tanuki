import {
  INSTALL_OUTCOME,
  INSTALL_STORAGE_KEY,
  REQUIRED_CHAPTERS,
  type InstallHistory,
  type InstallPromptEvent,
} from './models';

const LISTENERS = new Set<() => void>();
let deferredPrompt: InstallPromptEvent | null = null;
let history: InstallHistory = { chapters: [], dismissed: false };
let isInstalled = false;

const notify = () => LISTENERS.forEach((listener) => listener());

const readHistory = (): InstallHistory => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(INSTALL_STORAGE_KEY) ?? 'null');
    if (
      typeof value === 'object' &&
      value !== null &&
      'chapters' in value &&
      Array.isArray(value.chapters) &&
      value.chapters.every((chapter) => typeof chapter === 'string') &&
      'dismissed' in value &&
      typeof value.dismissed === 'boolean'
    ) {
      return {
        chapters: [...new Set<string>(value.chapters)].slice(0, REQUIRED_CHAPTERS),
        dismissed: value.dismissed,
      };
    }
  } catch {
    // Недоступное хранилище не мешает предложению в текущем сеансе.
  }
  return { chapters: [], dismissed: false };
};

const saveHistory = () => {
  try {
    localStorage.setItem(INSTALL_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // В приватном режиме состояние остаётся в памяти.
  }
  notify();
};

/** Подписываемся до React: событие может прийти, пока приложение ещё загружается. */
export const registerInstallPrompt = () => {
  history = readHistory();
  const standalone = window.matchMedia('(display-mode: standalone)');
  isInstalled = standalone.matches;
  const onDisplayModeChange = (event: MediaQueryListEvent) => {
    isInstalled = event.matches;
    notify();
  };
  const onBeforeInstall = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notify();
  };
  const onInstalled = () => {
    isInstalled = true;
    deferredPrompt = null;
    notify();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== INSTALL_STORAGE_KEY && event.key !== null) return;
    history = readHistory();
    notify();
  };
  standalone.addEventListener('change', onDisplayModeChange);
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onInstalled);
  window.addEventListener('storage', onStorage);
  notify();

  return () => {
    standalone.removeEventListener('change', onDisplayModeChange);
    window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    window.removeEventListener('appinstalled', onInstalled);
    window.removeEventListener('storage', onStorage);
    deferredPrompt = null;
    notify();
  };
};

export const subscribeToInstall = (listener: () => void) => {
  LISTENERS.add(listener);
  return () => {
    LISTENERS.delete(listener);
  };
};

export const canInstallApp = () => deferredPrompt !== null && !isInstalled;
export const shouldOfferInstall = () =>
  canInstallApp() && !history.dismissed && history.chapters.length >= REQUIRED_CHAPTERS;

/** Две разные главы на устройстве, включая офлайн-чтение; повтор той же главы не считается. */
export const recordCompletedChapter = (titleId: string, chapterId: string) => {
  const key = JSON.stringify([titleId, chapterId]);
  if (history.chapters.length >= REQUIRED_CHAPTERS || history.chapters.includes(key)) return;
  history = { ...history, chapters: [...history.chapters, key] };
  saveHistory();
};

export const dismissInstallOffer = () => {
  history = { ...history, dismissed: true };
  saveHistory();
};

/** prompt вызывается сразу из клика, до первого await; один экземпляр события одноразовый. */
export const installApp = async () => {
  if (!canInstallApp()) return;
  const prompt = deferredPrompt;
  if (!prompt) return;
  deferredPrompt = null;
  dismissInstallOffer();
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === INSTALL_OUTCOME.ACCEPTED) isInstalled = true;
  } catch {
    // Браузер мог отозвать событие; ждём следующего beforeinstallprompt.
  }
  notify();
};
