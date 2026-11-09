import { HOME_SECTION_KIND, SORT_ORDER, VIEW_MODE, type SortOrder } from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import type { RawHomeSectionInfo, RawHomeSectionParams, RawTitle } from '../../types';
import type { Doc } from '../../core/html/dom';
import { uniqueByUrl } from '../../core/home';
import { ParseError } from '../../errors';
import { SOURCE_ID } from '../catalog';
import { parseNudeMoonHomeCard } from './homeCard';

export const NUDEMOON_HOME_SECTION = {
  NEW_TRANSLATIONS: 'newTranslations',
  POPULAR: 'popular',
} as const;

const TOP_CACHE_TTL_MS = 30 * 60_000;
const MONTH_FORMAT = new Intl.DateTimeFormat('ru', { month: 'long', timeZone: 'UTC' });
const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  MONTH_FORMAT.format(new Date(Date.UTC(2000, month, 1))),
);
const PERIOD_FORMAT = new Intl.DateTimeFormat('ru', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const getNudeMoonMonths = (now = new Date()) =>
  Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const label = PERIOD_FORMAT.format(date).replace(/ г\.$/, '');
    return {
      id: date.toISOString().slice(0, 7),
      title: label[0]!.toUpperCase() + label.slice(1),
    };
  });

export const getNudeMoonHomeSections = (): RawHomeSectionInfo[] => [
  {
    id: NUDEMOON_HOME_SECTION.NEW_TRANSLATIONS,
    title: 'Новые переводы',
    kind: HOME_SECTION_KIND.NEW,
  },
  {
    id: NUDEMOON_HOME_SECTION.POPULAR,
    title: 'Популярные',
    kind: HOME_SECTION_KIND.POPULAR,
    viewMode: VIEW_MODE.COVERLESS,
    variants: getNudeMoonMonths(),
    sortOrders: [SORT_ORDER.LIKES, SORT_ORDER.VIEWS],
  },
];

/** The three anchors delimit whole tables; title links inside previews must not become rows. */
export const parseNudeMoonTop = (doc: Doc, now = new Date()): Map<string, RawTitle[]> => {
  const { $ } = doc;
  const anchors = $('[id="month"], [id="month1"], [id="month2"]');
  if (anchors.length === 0)
    throw new ParseError('Missing popular month sections', SOURCE_ID.NUDEMOON);
  const months = getNudeMoonMonths(now);
  const result = new Map<string, RawTitle[]>();
  anchors.each((_, anchor) => {
    const headingTable = $(anchor).nextAll('table').first();
    const content = headingTable.nextAll('table').first();
    const heading = headingTable.find('h1').first().text().trim();
    const headingMonth = /^популярные переводы за (\p{L}+)$/u.exec(heading.toLowerCase())?.[1];
    if (
      !headingMonth ||
      !MONTH_NAMES.includes(headingMonth) ||
      !content.length ||
      content.find('h1').length > 0
    ) {
      throw new ParseError('Invalid popular month section', SOURCE_ID.NUDEMOON);
    }
    const month = months.find(({ id }) => {
      const name = MONTH_FORMAT.format(new Date(`${id}-01T00:00:00Z`));
      return heading.toLowerCase() === `популярные переводы за ${name}`;
    });
    // A site that has not rolled over yet may omit the current calendar month.
    if (!month) return;
    const items: RawTitle[] = [];
    content.find('td.news_pic').each((_, cell) => {
      const item = parseNudeMoonHomeCard($(cell).find('a.help').first(), doc, true);
      if (item) items.push(item);
    });
    result.set(month.id, uniqueByUrl(items));
  });
  return result;
};

/** One public /top response serves all three months; concurrent callers share its promise. */
export const createNudeMoonPopular = (ctx: ParserContext) => {
  const cache = new Map<
    SortOrder,
    { month: string; storedAt: number; request: Promise<Map<string, RawTitle[]>> }
  >();
  return async ({ page, variant, order }: RawHomeSectionParams) => {
    if (page > 1) return { items: [], hasNextPage: false };
    const months = getNudeMoonMonths();
    const month = months.find(({ id }) => id === variant)?.id ?? months[0]!.id;
    const resolvedOrder = order === SORT_ORDER.VIEWS ? SORT_ORDER.VIEWS : SORT_ORDER.LIKES;
    let entry = cache.get(resolvedOrder);
    if (
      !entry ||
      entry.month !== months[0]!.id ||
      Date.now() - entry.storedAt >= TOP_CACHE_TTL_MS
    ) {
      const getTopUrl = () => {
        switch (resolvedOrder) {
          case SORT_ORDER.VIEWS:
            return `https://${ctx.domain}/top?vis`;
          case SORT_ORDER.LIKES:
            return `https://${ctx.domain}/top?like`;
        }
      };
      const request = ctx.http.getHtml(getTopUrl()).then((doc) => parseNudeMoonTop(doc));
      entry = { month: months[0]!.id, storedAt: Date.now(), request };
      cache.set(resolvedOrder, entry);
      void request.catch(() => {
        if (cache.get(resolvedOrder)?.request === request) cache.delete(resolvedOrder);
      });
    }
    return { items: (await entry.request).get(month) ?? [], hasNextPage: false };
  };
};
