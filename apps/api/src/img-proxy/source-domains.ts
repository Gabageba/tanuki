// Referer, который источник ожидает от хотлинков на свои картинки. Не origin CDN — сайты
// сверяют Referer со своим публичным доменом, поэтому нужна явная карта, а не эвристика
// по самому URL картинки. Расширяется по мере подключения источников (Фаза 2).
const SOURCE_REFERERS: Record<string, string> = {
  DESUME: 'https://x.desu.city/',
};

export function getSourceReferer(sourceId: string, imageUrl: string): string {
  return SOURCE_REFERERS[sourceId] ?? new URL(imageUrl).origin + '/';
}
