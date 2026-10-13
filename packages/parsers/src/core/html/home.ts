import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Doc } from './dom';

const normalizeHeading = (text: string): string => text.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Заголовок блока главной по его тексту — так блок находится, даже если сайт переставил блоки
 * местами. Сравнение без регистра и лишних пробелов; совпадение — по началу текста, потому что
 * в заголовке рядом с названием бывают счётчики и ссылки «Все».
 */
export const findHomeHeading = (
  doc: Doc,
  selector: string,
  title: string,
): Cheerio<AnyNode> | null => {
  const expected = normalizeHeading(title);
  const heading = doc
    .$(selector)
    .toArray()
    .find((el) => normalizeHeading(doc.$(el).text()).startsWith(expected));
  return heading ? doc.$(heading) : null;
};
