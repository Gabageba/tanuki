import type { MantineColor } from '@mantine/core';

export type PreviewCover = {
  id: string;
  isAdult: boolean;
  /** Градиент заглушки — от тёмного шага первого цвета к светлому второго. */
  colors: [MantineColor, MantineColor];
};

/**
 * Нейтральные заглушки вместо обложек реальных тайтлов: обычная и две 18+. Круги на градиенте
 * нужны, чтобы размытие было видно — на ровной заливке его не отличить.
 */
export const PREVIEW_COVERS: PreviewCover[] = [
  { id: 'regular', isAdult: false, colors: ['indigo', 'cyan'] },
  { id: 'adult-first', isAdult: true, colors: ['grape', 'pink'] },
  { id: 'adult-second', isAdult: true, colors: ['red', 'orange'] },
];

export const PREVIEW_COVER_WIDTH = 32;

/** Размытие мини-обложки — пропорционально меньше, чем у обложки в каталоге. */
export const PREVIEW_COVER_BLUR = 4;
