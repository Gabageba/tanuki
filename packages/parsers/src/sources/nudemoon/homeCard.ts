import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { CONTENT_RATING } from '@tanuki/contracts';
import { parseHtml, type Doc } from '../../core/html/dom';
import { absUrl } from '../../core/html/selectors';
import { generateUid } from '../../core/uid';
import { RATING_UNKNOWN, type RawTitle } from '../../types';
import { SOURCE_ID } from '../catalog';
import { mangaTypeOfTags, splitNudeMoonTitle } from './lib';

const parseCounter = (value: string | undefined): number | null => {
  if (!value) return null;
  const match = /(\d[\d\s.,]*)\s*(тыс|млн)?/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]!.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * (match[2] === 'млн' ? 1_000_000 : match[2] === 'тыс' ? 1000 : 1));
};

/** Both home feeds expose metadata in the same tooltip and counters beside the title link. */
export const parseNudeMoonHomeCard = (
  card: Cheerio<AnyNode>,
  doc: Doc,
  coverless = false,
): RawTitle | null => {
  const href = card.attr('href');
  if (!href) return null;
  const url = new URL(href, doc.baseUrl);
  const relative = url.pathname;
  if (!/^\/\d+-/.test(relative)) return null;
  const image = card.find('img.news_pic2').first();
  const rawName = image.attr('title') ?? card.find('h2').first().text();
  const { title, altTitle } = splitNudeMoonTitle(rawName.trim());
  if (!title) return null;
  const tip = card.find('.airhelp');
  const html = tip.html() ?? '';
  const parts = html.split(/<hr\b[^>]*>/i);
  // Without a description there are only four sections: heading, image, credits and tags.
  const description =
    parts.length >= 5
      ? parseHtml(parts.at(-2) ?? '', doc.baseUrl)
          .$.root()
          .text()
          .trim() || null
      : null;
  const readNames = (label: string) => {
    const value = new RegExp(`${label}:\\s*</font>([\\s\\S]*?)(?:<br|<hr)`, 'i').exec(html)?.[1];
    return value
      ? parseHtml(value, doc.baseUrl)
          .$.root()
          .text()
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      : [];
  };
  const tags = tip
    .find('font.tiny')
    .text()
    .trim()
    .split(/\s{2,}/)
    .filter(Boolean)
    .map((name) => ({
      key: name,
      title: name[0]!.toUpperCase() + name.slice(1),
      source: SOURCE_ID.NUDEMOON,
    }));
  const counter = (icon: string) => {
    const node = card.closest('td.news_pic').find(`img[src$="/${icon}"]`)[0]?.next;
    return parseCounter(node?.type === 'text' ? node.data : undefined);
  };
  return {
    id: generateUid(SOURCE_ID.NUDEMOON, relative),
    title,
    altTitles: altTitle ? [altTitle] : [],
    url: relative,
    publicUrl: url.toString(),
    rating: RATING_UNKNOWN,
    contentRating: CONTENT_RATING.ADULT,
    coverUrl: coverless ? null : absUrl(image, 'src', doc.baseUrl),
    largeCoverUrl: null,
    description,
    tags,
    type: mangaTypeOfTags(tags),
    authors: readNames('Автор'),
    translators: readNames('Перевод'),
    series: readNames('Серия'),
    releaseState: null,
    chapters: null,
    source: SOURCE_ID.NUDEMOON,
    likes: counter('like.png'),
    views: counter('view.png'),
  };
};
