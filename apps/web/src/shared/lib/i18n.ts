import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  detectBrowserLanguage,
  getStoredLanguage,
  LANGUAGE,
  setStoredLanguage,
  type Language,
} from './language';
import { SETTINGS_STORAGE_KEY } from './settings';
import en from '@/shared/locales/en.json';
import ru from '@/shared/locales/ru.json';

/**
 * Единственный инстанс i18next. Компоненты получают его через `useTranslation()` (его отдаёт
 * I18nProvider); напрямую импортируют только места вне React — apiFetch и глобальный обработчик
 * ошибок в QueryClientProvider.
 */
export const I18N = i18next.createInstance().use(initReactI18next);
const initialLanguage = getStoredLanguage() ?? detectBrowserLanguage();

I18N.init({
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

I18N.on('languageChanged', (language) => {
  setStoredLanguage(language as Language);
  document.documentElement.lang = language;
});

// Кросс-табная синхронизация — тот же паттерн, что у COLOR_SCHEME_MANAGER в MantineProvider.
window.addEventListener('storage', (event) => {
  if (event.storageArea !== window.localStorage || event.key !== SETTINGS_STORAGE_KEY) return;
  const next = getStoredLanguage();
  if (next && next !== I18N.language) I18N.changeLanguage(next);
});
