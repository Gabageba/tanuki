import type { EnumLiteralsOf } from '@tanuki/contracts';

export const INSTALL_OUTCOME = {
  ACCEPTED: 'accepted',
  DISMISSED: 'dismissed',
} as const;

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: EnumLiteralsOf<typeof INSTALL_OUTCOME> }>;
};

export const INSTALL_STORAGE_KEY = 'tanuki-install-offer';
export const REQUIRED_CHAPTERS = 2;

export type InstallHistory = {
  chapters: string[];
  dismissed: boolean;
};
