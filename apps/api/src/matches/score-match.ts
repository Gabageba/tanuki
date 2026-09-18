import { MATCH_CONFIDENCE, type MatchConfidence } from '@tanuki/contracts';
import {
  AUTHORS_MATCH_BONUS,
  BOTH_CHANNELS_BONUS,
  CHAPTERS_MATCH_BONUS,
  CHAPTERS_MATCH_RATIO,
  CYRILLIC_FLOOR,
  DERIVED_VARIANT_CEILING,
  HIGH_TITLE_SCORE,
  HIGH_WITH_META_TITLE_SCORE,
  LATIN_FLOOR,
  LOW_WITH_AUTHORS_TITLE_SCORE,
  SCORE_FLOOR,
  TAGS_BONUS_WEIGHT,
  NAME_SCRIPT,
  TYPE_MATCH_BONUS,
  YEAR_MATCH_BONUS,
  YEAR_MISMATCH_PENALTY,
  YEAR_TOLERANCE,
  type MatchSubject,
  type NameScript,
  type NameVariant,
} from './models';
import { normalizeTitle, romanize, titleVariants, tokenize } from './normalize-name';
import { titleSimilarity } from './similarity';

export type MatchChannels = {
  latin: number;
  cyrillic: number;
};

export type MatchResult = {
  score: number;
  confidence: MatchConfidence;
  /** Название кандидата, по варианту которого сложился максимум. */
  matchedName: string;
  channels: MatchChannels;
};

type ChannelResult = {
  value: number;
  matchedName: string;
  demote: boolean;
  subtitled: boolean;
};

type MetadataResult = {
  bonus: number;
  /** Число независимых согласий — по ним HIGH выдаётся при более слабом тексте. */
  agreements: number;
  authorsAgree: boolean;
  yearConflicts: boolean;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const EMPTY_CHANNEL: ChannelResult = {
  value: 0,
  matchedName: '',
  demote: false,
  subtitled: false,
};

/** Множество токенов имён: сравнивать авторов построчно бессмысленно — порядок и форма разные. */
const authorTokens = (authors: string[]): Set<string> => {
  const tokens = new Set<string>();
  for (const author of authors) {
    const normalized = normalizeTitle(author);
    if (!normalized) continue;
    for (const token of tokenize(normalized)) tokens.add(token);
    // «Такэути Наоко» и «Naoko Takeuchi» — одно имя, записанное двумя способами.
    for (const token of tokenize(romanize(normalized))) tokens.add(token);
  }
  return tokens;
};

const hasIntersection = (left: Set<string>, right: Set<string>): boolean => {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
};

const tagsSimilarity = (left: string[], right: string[]): number => {
  const a = new Set(left.map(normalizeTitle).filter(Boolean));
  const b = new Set(right.map(normalizeTitle).filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const tag of a) {
    if (b.has(tag)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
};

/**
 * Согласие метаданных — уточняющий сигнал, а не решающий. Поля заполнены далеко не у всех
 * источников (а у элементов каталожного списка почти никогда), поэтому отсутствие данных не
 * стоит ничего: бонус не начисляется, но и штрафа нет. Штрафует только прямое противоречие.
 */
export const metadataBonus = (ref: MatchSubject, candidate: MatchSubject): MetadataResult => {
  let bonus = 0;
  let agreements = 0;
  let yearConflicts = false;

  if (ref.year !== null && candidate.year !== null) {
    const delta = Math.abs(ref.year - candidate.year);
    if (delta === 0) {
      bonus += YEAR_MATCH_BONUS;
      agreements += 1;
    } else if (delta > YEAR_TOLERANCE) {
      // Разница в год легитимна: источники берут то год начала сериализации, то год тома.
      bonus += YEAR_MISMATCH_PENALTY;
      yearConflicts = true;
    }
  }

  const authorsAgree = hasIntersection(authorTokens(ref.authors), authorTokens(candidate.authors));
  if (authorsAgree) {
    bonus += AUTHORS_MATCH_BONUS;
    agreements += 1;
  }

  if (ref.type !== null && candidate.type !== null && ref.type === candidate.type) {
    bonus += TYPE_MATCH_BONUS;
    agreements += 1;
  }

  // Число глав сравнивается только в плюс. Расхождение здесь массовое и ни о чём не говорит:
  // 200 глав оригинала против 30 переведённых — обычное отставание перевода, а не признак
  // разных тайтлов. Поэтому далёкие значения дают ровно ноль, как если бы поля не было.
  if (ref.chaptersCount && candidate.chaptersCount) {
    const ratio =
      Math.min(ref.chaptersCount, candidate.chaptersCount) /
      Math.max(ref.chaptersCount, candidate.chaptersCount);
    if (ratio >= CHAPTERS_MATCH_RATIO) {
      bonus += CHAPTERS_MATCH_BONUS;
      agreements += 1;
    }
  }

  bonus += tagsSimilarity(ref.tags, candidate.tags) * TAGS_BONUS_WEIGHT;

  return { bonus, agreements, authorsAgree, yearConflicts };
};

const compareChannel = (
  script: NameScript,
  refVariants: NameVariant[],
  candidateVariants: NameVariant[],
): ChannelResult => {
  let best = EMPTY_CHANNEL;
  for (const left of refVariants.filter((variant) => variant.script === script)) {
    for (const right of candidateVariants.filter((variant) => variant.script === script)) {
      // Транслитерация — мост между скриптами, а не самостоятельный канал. Сравнивать две
      // наши же транслитерации бессмысленно: это то же кириллическое сравнение, переписанное
      // латиницей, и оно превратило бы «согласие двух независимых каналов» в согласие канала
      // с самим собой.
      if (left.derived && right.derived) continue;

      const similarity = titleSimilarity(left.value, right.value);
      // Совпадение по транслитерации, которую мы сами и придумали, — более слабое основание,
      // чем совпадение двух написанных людьми названий: точным его называть нельзя.
      const capped =
        left.derived || right.derived
          ? Math.min(similarity.value, DERIVED_VARIANT_CEILING)
          : similarity.value;

      if (capped > best.value) {
        best = {
          value: capped,
          matchedName: right.value,
          demote: similarity.demote,
          subtitled: similarity.subtitled,
        };
      }
    }
  }

  return best;
};

const isMultiWord = (value: string): boolean => tokenize(value).length >= 2;

const demoteOnce = (confidence: MatchConfidence): MatchConfidence => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return MATCH_CONFIDENCE.CONFIRMED;
    case MATCH_CONFIDENCE.EXACT:
      return MATCH_CONFIDENCE.HIGH;
    case MATCH_CONFIDENCE.HIGH:
      return MATCH_CONFIDENCE.LOW;
    case MATCH_CONFIDENCE.LOW:
      return MATCH_CONFIDENCE.LOW;
  }
};

/**
 * Уровень уверенности по двум каналам сразу.
 *
 * Считается по чистой похожести названий, а не по итоговому score: иначе бонус за совпавшего
 * автора перетаскивал бы кандидата в «вероятный» без всяких оснований по названию.
 *
 * Ключевое правило — согласие обоих скриптов. Совпало одно название хорошо, совпали оба очень
 * хорошо: латиница подтверждает ненадёжную кириллицу, и потолок с неё снимается.
 */
export const confidenceOf = (
  channels: MatchChannels,
  meta: Pick<MetadataResult, 'agreements' | 'authorsAgree' | 'yearConflicts'>,
  cyrillicTitle: string,
  /**
   * Один канал совпал точно, а другой распознал подзаголовок. Так выглядит спин-офф, у
   * которого в альтернативных названиях стоит название всей франшизы: латиница совпадает
   * буква в букву, а русские названия расходятся хвостом. Точным это звать нельзя.
   *
   * Просто разошедшиеся каналы противоречием НЕ считаются: «Истребитель демонов» и «Убийца
   * демонов» — обычные разные переводы одного тайтла.
   */
  conflicted = false,
): MatchConfidence | null => {
  const latinExact = channels.latin === 1;
  // Односложное точное совпадение по кириллице — слишком слабое основание для «точного»:
  // одинаковых однословных названий у разных произведений хватает.
  const cyrillicExact = channels.cyrillic === 1 && isMultiWord(cyrillicTitle);
  const bothChannels = channels.latin >= LATIN_FLOOR && channels.cyrillic >= CYRILLIC_FLOOR;

  if (latinExact && cyrillicExact) return MATCH_CONFIDENCE.EXACT;
  if ((latinExact || cyrillicExact) && !meta.yearConflicts && !conflicted) {
    return MATCH_CONFIDENCE.EXACT;
  }
  if (latinExact || channels.cyrillic === 1) return MATCH_CONFIDENCE.HIGH;

  if (bothChannels) return MATCH_CONFIDENCE.HIGH;
  if (channels.latin >= HIGH_TITLE_SCORE) return MATCH_CONFIDENCE.HIGH;
  if (channels.latin >= HIGH_WITH_META_TITLE_SCORE && meta.agreements >= 2) {
    return MATCH_CONFIDENCE.HIGH;
  }

  if (channels.latin >= LATIN_FLOOR) return MATCH_CONFIDENCE.LOW;
  // Одинокая кириллица не поднимается выше «возможно» ни при каком счёте: разные любительские
  // переводы одного тайтла и разные тайтлы выглядят одинаково.
  if (channels.cyrillic >= CYRILLIC_FLOOR) return MATCH_CONFIDENCE.LOW;
  if (channels.latin >= LOW_WITH_AUTHORS_TITLE_SCORE && meta.authorsAgree) {
    return MATCH_CONFIDENCE.LOW;
  }

  return null;
};

/** Сравнивает тайтл-эталон с кандидатом. null — кандидат не проходит по порогу. */
export const scoreMatch = (ref: MatchSubject, candidate: MatchSubject): MatchResult | null => {
  const refVariants = titleVariants(ref);
  const candidateVariants = titleVariants(candidate);

  const latin = compareChannel(NAME_SCRIPT.LATIN, refVariants, candidateVariants);
  const cyrillic = compareChannel(NAME_SCRIPT.CYRILLIC, refVariants, candidateVariants);
  const channels: MatchChannels = { latin: latin.value, cyrillic: cyrillic.value };

  const meta = metadataBonus(ref, candidate);
  const bothChannels = channels.latin >= LATIN_FLOOR && channels.cyrillic >= CYRILLIC_FLOOR;

  const base = Math.max(channels.latin, channels.cyrillic);
  const score = clamp01(base + (bothChannels ? BOTH_CHANNELS_BONUS : 0) + meta.bonus);

  const conflicted =
    (latin.value === 1 && cyrillic.subtitled && channels.cyrillic >= CYRILLIC_FLOOR) ||
    (cyrillic.value === 1 && latin.subtitled && channels.latin >= LATIN_FLOOR);

  const confidence = confidenceOf(channels, meta, cyrillic.matchedName, conflicted);
  if (!confidence || score < SCORE_FLOOR) return null;

  const winner = channels.latin >= channels.cyrillic ? latin : cyrillic;

  return {
    score,
    confidence: winner.demote ? demoteOnce(confidence) : confidence,
    matchedName: winner.matchedName,
    channels,
  };
};
