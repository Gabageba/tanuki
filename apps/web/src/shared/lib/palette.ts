import type { MantineColorsTuple } from '@mantine/core';

/**
 * Палитра снята с макета `src/assets/Tanuki-standalone.html` (заход 4 — страница тайтла в
 * выбранной гамме). Правило макета: рыжий работает только как бренд и действия, рейтинг —
 * приглушённый янтарь, статусы источников — зелёный/золотой/красный, всё остальное нейтрально.
 *
 * Все шкалы построены в OKLCH с общим холодным тоном нейтралей (hue ≈ 255), поэтому светлая и
 * тёмная темы — одна палитра при разной подсветке.
 *
 * Живёт в `shared`, а не в `app/components/Providers`, потому что цвета статусов нужны и ниже по
 * слоям (`entities/source`, `pages/Sources`), а `app` — верхний слой, импорт из него оттуда
 * запрещён линтом.
 */

export const PRIMARY_COLOR = 'terracotta';
/** Один и тот же оттенок в обеих темах — в макете лого, кнопки и бейджи не меняют цвет. */
export const PRIMARY_SHADE = 6;
/** oklch(0.72 0.14 34) на 6-м шаге — тот самый рыжий из макета. */
export const PRIMARY_COLOR_SHADES: MantineColorsTuple = [
  '#ffeee9',
  '#ffd8cd',
  '#ffc1b0',
  '#ffaa95',
  '#fa9a84',
  '#f48e76',
  '#ef8168',
  '#de6e55',
  '#c95c43',
  '#ae4f3a',
];

export const RATING_COLOR = 'amber';
export const RATING_COLOR_SHADES: MantineColorsTuple = [
  '#faf3e1',
  '#f3e5c5',
  '#e7d6ac',
  '#dac593',
  '#cdb57a',
  '#c0a460',
  '#b19344',
  '#a2822a',
  '#8d6f18',
  '#755b12',
];

export const STATUS_OK_COLOR = 'moss';
export const STATUS_OK_COLOR_SHADES: MantineColorsTuple = [
  '#e5faea',
  '#cbf4d5',
  '#a8eeba',
  '#80e69e',
  '#48de81',
  '#40c472',
  '#3cb067',
  '#369e5c',
  '#2c894e',
  '#267543',
];

export const STATUS_DEGRADED_COLOR = 'gold';
export const STATUS_DEGRADED_COLOR_SHADES: MantineColorsTuple = [
  '#fef2df',
  '#fae3c0',
  '#f5d29c',
  '#edbf76',
  '#eab358',
  '#e2a73d',
  '#c38d29',
  '#a37312',
  '#8b6001',
  '#734f00',
];

export const STATUS_DOWN_COLOR = 'crimson';
export const STATUS_DOWN_COLOR_SHADES: MantineColorsTuple = [
  '#ffeded',
  '#ffd8d8',
  '#ffbcbd',
  '#ff9fa2',
  '#f88288',
  '#ee6c75',
  '#dd5561',
  '#c34652',
  '#a93a46',
  '#8d313a',
];
