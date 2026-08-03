export interface CacheTtlSpec {
  freshSeconds: number;
  staleSeconds: number;
}

const minutes = (n: number) => n * 60;
const hours = (n: number) => n * 60 * 60;
const days = (n: number) => n * 24 * 60 * 60;

export const CACHE_TTL = {
  sources: { freshSeconds: minutes(5), staleSeconds: hours(24) },
  catalog: { freshSeconds: minutes(5), staleSeconds: hours(6) },
  details: { freshSeconds: minutes(15), staleSeconds: hours(24) },
  tags: { freshSeconds: hours(1), staleSeconds: days(7) },
  // Короче остальных: у некоторых источников URL картинок бывают подписанными/протухающими,
  // долгий кеш рискует отдавать мёртвые ссылки.
  pages: { freshSeconds: minutes(5), staleSeconds: minutes(30) },
} satisfies Record<string, CacheTtlSpec>;

export type CacheEntity = keyof typeof CACHE_TTL;
