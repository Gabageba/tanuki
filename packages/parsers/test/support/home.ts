import type { Parser } from '../../src/core/parser';

/**
 * Главная разобрана по описанию источника: те же блоки в том же порядке, у каждого блока из
 * `nonEmpty` (по умолчанию — у всех) есть тайтлы, и тайтлы — как элементы getList: название,
 * адрес, обложка, без глав. Возвращает блоки и список нарушений — тест сверяет его с `[]`.
 */
export const checkHome = async (parser: Parser, nonEmpty?: string[]) => {
  const sections = await parser.getHome!();
  const problems: string[] = [];
  const ids = sections.map(({ id }) => id).join();
  const described = parser.info.homeSections.map(({ id }) => id).join();
  if (ids !== described) problems.push(`sections ${ids} instead of ${described}`);
  for (const { id, items } of sections) {
    if ((!nonEmpty || nonEmpty.includes(id)) && items.length === 0) problems.push(`${id}: empty`);
    for (const item of items) {
      if (!item.title) problems.push(`${id}: item without title`);
      if (!item.url) problems.push(`${id}: ${item.title} without url`);
      if (!/^https?:\/\//.test(item.coverUrl ?? '')) problems.push(`${id}: ${item.title} cover`);
      if (item.chapters !== null) problems.push(`${id}: ${item.title} has chapters`);
      if (!Number.isSafeInteger(item.id)) problems.push(`${id}: ${item.title} id`);
    }
  }
  return { sections, problems };
};
