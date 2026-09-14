import type { ReactNode } from 'react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import {
  detectBrowserLanguage,
  getStoredLanguage,
  LANGUAGE,
  setStoredLanguage,
  type Language,
} from '@/shared/lib/language';
import { SETTINGS_STORAGE_KEY } from '@/shared/lib/settings';
import en from '@/shared/locales/en.json';
import ru from '@/shared/locales/ru.json';

const i18n = i18next.createInstance();
const initialLanguage = getStoredLanguage() ?? detectBrowserLanguage();

i18n.use(initReactI18next).init({
  resources: {
    [LANGUAGE.RU]: { translation: ru },
    [LANGUAGE.EN]: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: LANGUAGE.RU,
  interpolation: { escapeValue: false },
});

// `init()` only sets `i18n.language` — it doesn't emit `languageChanged`, so the initial value
// needs setting here too, not just on later `changeLanguage()` calls below.
document.documentElement.lang = initialLanguage;

i18n.on('languageChanged', (language) => {
  setStoredLanguage(language as Language);
  document.documentElement.lang = language;
});

// Кросс-табная синхронизация — тот же паттерн, что у COLOR_SCHEME_MANAGER в MantineProvider.
window.addEventListener('storage', (event) => {
  if (event.storageArea !== window.localStorage || event.key !== SETTINGS_STORAGE_KEY) return;
  const next = getStoredLanguage();
  if (next && next !== i18n.language) i18n.changeLanguage(next);
});

type Props = {
  children: ReactNode;
};

function I18nProvider({ children }: Props) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;
