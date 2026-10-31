import { nullIfEmpty } from '../../core/text/strings';

/** Nude-Moon puts the translated title after the original: "Original / Translation". */
export const splitNudeMoonTitle = (raw: string): { title: string; altTitle: string | null } => {
  const idx = raw.indexOf(' / ');
  if (idx === -1) return { title: raw, altTitle: null };
  return { title: raw.slice(idx + 3), altTitle: nullIfEmpty(raw.slice(0, idx)) };
};
