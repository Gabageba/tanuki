import { type EnumLiteralsOf } from '@tanuki/contracts';
import { readSettings, writeSettings } from './settings';

export const LANGUAGE = {
  RU: 'ru',
  EN: 'en',
} as const;
export type Language = EnumLiteralsOf<typeof LANGUAGE>;

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
