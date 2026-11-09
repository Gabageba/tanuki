import { nullIfEmpty } from '../../core/text/strings';
import { TITLE_TYPE } from '@tanuki/contracts';
import type { RawTag, RawTitleType } from '../../types';

/** The site exposes comics and manhwa as tags; other titles use its default manga format. */
export const mangaTypeOfTags = (tags: RawTag[]): RawTitleType => {
  const titles = new Set(tags.map((tag) => tag.title.toLowerCase()));
  if (titles.has('комикс')) return TITLE_TYPE.COMICS;
  if (titles.has('манхва')) return TITLE_TYPE.MANHWA;
  return TITLE_TYPE.MANGA;
};

/** Nude-Moon puts the translated title after the original: "Original / Translation". */
export const splitNudeMoonTitle = (raw: string): { title: string; altTitle: string | null } => {
  const idx = raw.indexOf(' / ');
  if (idx === -1) return { title: raw, altTitle: null };
  return { title: raw.slice(idx + 3), altTitle: nullIfEmpty(raw.slice(0, idx)) };
};
