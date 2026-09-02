import type { EnumLiteralsOf } from '@tanuki/contracts';

/** `orig` — отдать байты источника как есть, без перекодирования. */
export const IMAGE_FORMAT = {
  WEBP: 'webp',
  AVIF: 'avif',
  ORIG: 'orig',
} as const;
export type ImageFormat = EnumLiteralsOf<typeof IMAGE_FORMAT>;

export type SignedImageOptions = {
  width?: number;
  format?: ImageFormat;
};

export type SignedImageParams = {
  u: string;
  s: string;
  exp: string;
  sig: string;
};

export type TransformedImage = {
  contentType: string;
  /** base64 — CacheService envelopes go through JSON.stringify, raw Buffer doesn't round-trip. */
  bodyBase64: string;
};
