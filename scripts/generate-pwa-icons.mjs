// Собирает иконки PWA из лапы-лого (Logo.tsx): public/icon.svg и PNG 192/512 + maskable.
// Запуск из корня: node scripts/generate-pwa-icons.mjs (нужен sharp — он есть в apps/api).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const sharp = require('sharp');

const BACKGROUND = '#0a0a0b';
// Рыжий акцент темы: PRIMARY_COLOR_SHADES[6].
const ACCENT = '#ef8168';

const logo = readFileSync(
  new URL('../apps/web/src/app/Layout/Header/Logo.tsx', import.meta.url),
  'utf8',
);
const pathData = /<path\s+d="([^"]+)"/.exec(logo)?.[1];
if (!pathData) throw new Error('Не нашёл path в Logo.tsx');

/** Лого занимает `ratio` стороны; остальное — поле (для maskable нужно не меньше 20% с краёв). */
const buildSvg = (ratio, radius) => {
  const scale = (512 * ratio) / 20;
  const offset = (512 - 512 * ratio) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${BACKGROUND}"/><path transform="translate(${offset} ${offset}) scale(${scale})" d="${pathData}" fill="${ACCENT}"/></svg>`;
};

const out = (name) => new URL(`../apps/web/public/${name}`, import.meta.url).pathname;
const any = buildSvg(0.62, 96);
const maskable = buildSvg(0.5, 0);

writeFileSync(out('icon.svg'), any);
await sharp(Buffer.from(any)).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(Buffer.from(any)).resize(512, 512).png().toFile(out('icon-512.png'));
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(out('icon-maskable-512.png'));
