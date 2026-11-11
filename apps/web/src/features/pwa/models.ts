import type { EnumLiteralsOf } from '@tanuki/contracts';

export const PWA_OFFER = {
  UPDATE: 'update',
  INSTALL: 'install',
} as const;
export type PwaOffer = EnumLiteralsOf<typeof PWA_OFFER>;
