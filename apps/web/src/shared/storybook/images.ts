/** Картинки историй: обложки и страницы глав рисуются SVG прямо в обработчике MSW — без сети и
 *  без файлов в репозитории. Адреса похожи на настоящие (`/api/v1/img?...`), их отдаёт `IMAGE_HANDLER`. */

const IMG_PATH = '/api/v1/img';

/** Оттенок по строке — у каждой обложки свой, но от запуска к запуску тот же. */
const getHue = (seed: string) =>
  [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 7);

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export const getCoverUrl = (name: string) => `${IMG_PATH}?cover=${encodeURIComponent(name)}`;

export const getPageUrl = (chapterId: string, index: number) =>
  `${IMG_PATH}?chapter=${encodeURIComponent(chapterId)}&page=${index}`;

export const COVER_SIZE = { width: 300, height: 430 } as const;
export const PAGE_SIZE = { width: 800, height: 1200 } as const;

export const renderCoverSvg = (name: string) => {
  const hue = getHue(name);
  const { width, height } = COVER_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 55% 42%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 60% 18%)"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width * 0.72}" cy="${height * 0.3}" r="${width * 0.22}" fill="hsl(${hue} 70% 70% / 0.35)"/>
  <text x="24" y="${height - 32}" font-family="sans-serif" font-size="28" font-weight="700" fill="white">${escapeXml(name)}</text>
</svg>`;
};

export const renderPageSvg = (
  chapterId: string,
  index: number,
  pageHeight: number = PAGE_SIZE.height,
) => {
  const hue = getHue(chapterId);
  const { width } = PAGE_SIZE;
  const height = pageHeight;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="hsl(${hue} 10% 92%)"/>
  <rect x="40" y="40" width="${width - 80}" height="${height * 0.45}" fill="none" stroke="#222" stroke-width="6"/>
  <rect x="40" y="${height * 0.5}" width="${width / 2 - 50}" height="${height * 0.45}" fill="none" stroke="#222" stroke-width="6"/>
  <rect x="${width / 2 + 10}" y="${height * 0.5}" width="${width / 2 - 50}" height="${height * 0.45}" fill="none" stroke="#222" stroke-width="6"/>
  <text x="50%" y="${height * 0.27}" text-anchor="middle" font-family="sans-serif" font-size="96" font-weight="700" fill="#222">${index + 1}</text>
</svg>`;
};
