import type { EnumLiteralsOf } from '@tanuki/contracts';

/** `orig` — отдать байты источника как есть, без перекодирования. */
export const IMAGE_FORMAT = {
  WEBP: 'webp',
  AVIF: 'avif',
  ORIG: 'orig',
} as const;
export type ImageFormat = EnumLiteralsOf<typeof IMAGE_FORMAT>;

export const IMAGE_WIDTHS = [360, 480, 720, 1080, 1440] as const;
export const IMAGE_MAX_BYTES = 16 * 1024 * 1024;
export const IMAGE_MAX_PIXELS = 20_000_000;

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
