import type { RawHomeSection, RawHomeSectionInfo, RawTitle } from '../types';

/**
 * Блоки главной в порядке описания: блок, которого не нашлось, — пустой, а не ошибка. Так
 * переезд одного блока на сайте не роняет остальные.
 */
export const toHomeSections = (
  infos: readonly RawHomeSectionInfo[],
  itemsById: Partial<Record<string, RawTitle[]>>,
): RawHomeSection[] => infos.map((info) => ({ ...info, items: itemsById[info.id] ?? [] }));

/**
 * Главная, собранная отдельными запросами на блок (JSON-источники). Упавший запрос даёт пустой
 * блок; упали все — источник не ответил, и ошибка уходит выше.
 */
export const fetchHomeSections = async <Id extends string>(
  infos: readonly (RawHomeSectionInfo & { id: Id })[],
  fetchSection: (id: Id) => Promise<RawTitle[]>,
): Promise<RawHomeSection[]> => {
  const settled = await Promise.allSettled(infos.map(({ id }) => fetchSection(id)));
  const firstError = settled.find((result) => result.status === 'rejected');
  if (firstError && settled.every((result) => result.status === 'rejected')) {
    throw firstError.reason;
  }
  return infos.map((info, index) => {
    const result = settled[index];
    return { ...info, items: result?.status === 'fulfilled' ? result.value : [] };
  });
};

/** Один тайтл в нескольких местах блока (сайт дублирует карточки в мобильной и десктопной
 *  вёрстке) — оставляем первое появление. */
export const uniqueByUrl = (items: RawTitle[]): RawTitle[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};
