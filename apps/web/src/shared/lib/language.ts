import { LANGUAGE, type Language } from '@tanuki/contracts';
import { readSettings, writeSettings } from './settings';

export { LANGUAGE, type Language };

export const getStoredLanguage = (): Language | undefined => readSettings().language;

export const setStoredLanguage = (language: Language) => writeSettings({ language });

export const detectBrowserLanguage = (): Language =>
  navigator.language.toLowerCase().startsWith('ru') ? LANGUAGE.RU : LANGUAGE.EN;

export const getLanguageLabel = (language: Language) => {
  switch (language) {
    case LANGUAGE.RU:
      return 'Русский';
    case LANGUAGE.EN:
      return 'English';
  }
};
