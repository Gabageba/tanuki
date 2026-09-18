import type { EnumLiteralsOf } from '@tanuki/contracts';
import { NAME_SCRIPT, type MatchSubject } from './models';
import { probeHead, titleVariants } from './normalize-name';

/**
 * Волна опроса источников. Первая идёт латинским названием, вторая — русским, и только по тем
 * источникам, которые на первой ничего не нашли.
 */
export const MATCH_WAVE = {
  PRIMARY: 'primary',
  FALLBACK: 'fallback',
} as const;
export type MatchWave = EnumLiteralsOf<typeof MATCH_WAVE>;

/**
 * Выбирает поисковый запрос для источника.
 *
 * Латиница идёт первой, и это не мелочь: русские названия у каждого сайта свои (перевод-то
 * любительский), поэтому русский зонд ищет строку, которой на чужом сайте попросту нет.
 * Латинское же название почти все RU-каталоги хранят рядом как альтернативное и по нему ищут.
 *
 * Транслитерации (derived-варианты) в зонды не годятся: наша выдумка не совпадёт с тем, что
 * лежит в чужом индексе. Годится только то, что написали люди.
 */
export const pickProbe = (ref: MatchSubject, wave: MatchWave): string | null => {
  const variants = titleVariants(ref).filter((variant) => !variant.derived);

  const latin = variants.find((variant) => variant.script === NAME_SCRIPT.LATIN);
  const cyrillic = variants.find((variant) => variant.script === NAME_SCRIPT.CYRILLIC);

  if (wave === MATCH_WAVE.PRIMARY) {
    const primary = latin ?? cyrillic;
    return primary ? probeHead(primary.value) : null;
  }

  // Вторая волна нужна ровно затем, чтобы попробовать ДРУГОЙ скрипт. Если на первой уже
  // ходили с русским (латинского названия у тайтла нет), повторять его бессмысленно.
  if (!latin || !cyrillic) return null;
  return probeHead(cyrillic.value);
};
