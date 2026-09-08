/**
 * Единый серверный формат даты-времени: `YYYY-MM-DDTHH:MM:SSZ`. Именно он уходит наружу в
 * контрактах (Chapter.uploadedAt, Branch.lastUpdatedAt) — миллисекунды из Date#toISOString
 * отбрасываются, источники их всё равно не дают.
 */
export const toServerDateTime = (epochMs: number): string => {
  return `${new Date(epochMs).toISOString().slice(0, 19)}Z`;
};

/**
 * Date-only server format: `YYYY-MM-DD`. Used where the source carries a date but no time (e.g.
 * Manga.releaseDate).
 */
export const toServerDate = (epochMs: number): string => {
  return new Date(epochMs).toISOString().slice(0, 10);
};
