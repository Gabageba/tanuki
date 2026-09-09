import { FUZZY_CEILING, NOISE_TOKENS, SEQUEL_MARKERS, STOP_TOKENS, VARIANT_TOKENS } from './models';
import { foldHomoglyphs, stemRu, tokenize } from './normalize-title';

/** Результат сравнения пары названий. `demote` просит понизить итоговую уверенность на ступень. */
export type TitleSimilarity = {
  value: number;
  demote: boolean;
  /**
   * Одно название оказалось началом другого, а хвост — не служебная пометка, а осмысленный
   * подзаголовок («Магическая битва» против «Магическая битва: Модуль»). Такое совпадение
   * всегда под подозрением: так выглядят и подзаголовок того же тайтла, и отдельный спин-офф.
   */
  subtitled: boolean;
};

type ContainmentResult = {
  value: number;
  /** Штраф, применяемый к итогу независимо от того, победил containment или нет. */
  penalty: number;
  /**
   * Потолок итоговой похожести. Нужен, потому что на длинном общем префиксе символьный Дайс
   * сам по себе выдаёт больше, чем случай заслуживает: «Solo Leveling» и «Solo Leveling
   * Ragnarok» совпадают текстом на 0.73, хотя это разные тайтлы.
   */
  ceiling: number | null;
  demote: boolean;
};

const CONTAINMENT_NOISE_SCORE = 0.95;
const CONTAINMENT_UNKNOWN_SCORE = 0.72;
const SEQUEL_PENALTY = -0.2;
/** Однотокенное короткое название слишком легко оказывается началом чужого. */
const CONTAINMENT_MIN_SHORT_LENGTH = 8;
const NUMERIC_TOKEN_PATTERN = /^\d+$/;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const bigramCounts = (value: string): Map<string, number> => {
  const counts = new Map<string, number>();
  for (let i = 0; i < value.length - 1; i += 1) {
    const bigram = value.slice(i, i + 2);
    counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
  }
  return counts;
};

/**
 * Коэффициент Дайса на символьных биграммах, считаемый по МУЛЬТИмножеству.
 *
 * Множественная версия — классическая ошибка: для неё "аааа" и "аа" неразличимы и дают 1.0.
 * Здесь повторы учитываются, поэтому короткая строка не может полностью «покрыть» длинную.
 */
export const diceBigrams = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const left = bigramCounts(a);
  const right = bigramCounts(b);

  let intersection = 0;
  for (const [bigram, count] of left) {
    intersection += Math.min(count, right.get(bigram) ?? 0);
  }

  const total = a.length - 1 + (b.length - 1);
  return (2 * intersection) / total;
};

const significantStems = (tokens: string[]): Set<string> => {
  const meaningful = tokens.filter((token) => !STOP_TOKENS.has(token));
  // Если служебные слова съели название целиком, сравниваем как есть — иначе получим пустое
  // множество и ложный ноль.
  const source = meaningful.length > 0 ? meaningful : tokens;
  return new Set(source.map(stemRu));
};

/**
 * Жаккар по основам слов. Именно основы, а не токены: русские названия у разных источников
 * расходятся формой слова («Истребитель демонов» / «Истребители демонов»), и по токенам такие
 * пары не сходятся.
 */
export const jaccardStems = (a: string, b: string): number => {
  const left = significantStems(tokenize(a));
  const right = significantStems(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const stem of left) {
    if (right.has(stem)) intersection += 1;
  }

  return intersection / (left.size + right.size - intersection);
};

/**
 * Сколько «сезона» в названии. Отсутствие номера — это первая часть, поэтому по умолчанию 1:
 * так «Overlord» и «Overlord II» оказываются разными частями и разводятся гейтом.
 *
 * Арабские номера принимаются только в диапазоне 2..9 — иначе «Berserk 1998» превратилось бы
 * в 1998-й сезон.
 */
export const seasonOf = (value: string): number => {
  const tokens = tokenize(value);
  const last = tokens.at(-1);
  if (!last) return 1;

  const romanNumerals = new Map([
    ['ii', 2],
    ['iii', 3],
    ['iv', 4],
    ['v', 5],
    ['vi', 6],
    ['vii', 7],
    ['viii', 8],
    ['ix', 9],
    ['x', 10],
  ]);

  const keyword = tokens.find(
    (token) => token === 'season' || token === 'сезон' || token === 'part' || token === 'часть',
  );
  if (keyword) {
    const explicit = tokens.map(Number).find((parsed) => Number.isInteger(parsed) && parsed > 0);
    if (explicit) return explicit;
    // «2nd season» — номер приклеен к порядковому суффиксу.
    const ordinal = tokens.map((token) => /^(\d+)(st|nd|rd|th)$/.exec(token)).find(Boolean);
    if (ordinal) return Number(ordinal[1]);
  }

  const roman = romanNumerals.get(last);
  if (roman) return roman;

  if (NUMERIC_TOKEN_PATTERN.test(last)) {
    const parsed = Number(last);
    if (parsed >= 2 && parsed <= 9) return parsed;
  }

  return 1;
};

/**
 * Оценивает случай «одно название целиком является началом другого». Само по себе это ничего не
 * доказывает: «Kaguya-sama» ⊂ «Kaguya-sama: Tensai-tachi...» — тот же тайтл, а «Solo Leveling» ⊂
 * «Solo Leveling: Ragnarok» — другой. Поэтому решает не факт вхождения, а разбор хвоста.
 */
export const containmentScore = (a: string, b: string): ContainmentResult => {
  const none: ContainmentResult = { value: 0, penalty: 0, ceiling: null, demote: false };

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const [short, long] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  if (short.length === 0 || short.length === long.length) return none;

  const isPrefix = short.every((token, index) => long[index] === token);
  if (!isPrefix) return none;

  const residual = long.slice(short.length);

  if (residual.some((token) => SEQUEL_MARKERS.has(token) || NUMERIC_TOKEN_PATTERN.test(token))) {
    return { value: 0, penalty: SEQUEL_PENALTY, ceiling: null, demote: false };
  }

  // Хвост целиком состоит из служебных пометок. Если среди них есть пометка издания
  // («цветная версия», «remake»), это то же произведение, но не та же самая книга: матч
  // засчитываем, уверенность понижаем на ступень.
  if (residual.every((token) => NOISE_TOKENS.has(token) || VARIANT_TOKENS.has(token))) {
    const isVariant = residual.some((token) => VARIANT_TOKENS.has(token));
    return { value: CONTAINMENT_NOISE_SCORE, penalty: 0, ceiling: null, demote: isVariant };
  }

  // Хвост из собственных имён: «Ragnarok», «Tensai-tachi no Renai Zunousen». Отличить
  // продолжение от подзаголовка того же тайтла текстом невозможно — отсюда потолок «возможно
  // тот же», дальше решают метаданные.
  //
  // Проверка длины стоит здесь, а не в начале: короткое однословное название слишком легко
  // оказывается началом чужого («Gin» ⊂ «Gin Tama»), но это рассуждение верно только для
  // неизвестного хвоста. Если хвост — пометка формата, «Naruto» и «Naruto манга» остаются
  // одним и тем же тайтлом независимо от длины.
  const shortLength = short.join(' ').length;
  if (short.length === 1 && shortLength < CONTAINMENT_MIN_SHORT_LENGTH) return none;

  return {
    value: CONTAINMENT_UNKNOWN_SCORE,
    penalty: 0,
    ceiling: CONTAINMENT_UNKNOWN_SCORE,
    demote: false,
  };
};

/** Похожесть двух нормализованных названий внутри одного скрипта. */
export const titleSimilarity = (a: string, b: string): TitleSimilarity => {
  const none: TitleSimilarity = { value: 0, demote: false, subtitled: false };
  if (!a || !b) return none;

  // Разные части одной франшизы — не один тайтл, сколько бы общего текста в них ни было.
  if (seasonOf(a) !== seasonOf(b)) return none;

  if (a === b || foldHomoglyphs(a) === foldHomoglyphs(b)) {
    return { value: 1, demote: false, subtitled: false };
  }

  const sortedA = tokenize(a).sort().join(' ');
  const sortedB = tokenize(b).sort().join(' ');
  if (sortedA === sortedB) return { value: FUZZY_CEILING, demote: false, subtitled: false };

  const containment = containmentScore(a, b);
  const best = Math.max(diceBigrams(a, b), jaccardStems(a, b), containment.value);
  const ceiling = Math.min(FUZZY_CEILING, containment.ceiling ?? FUZZY_CEILING);

  return {
    value: clamp01(Math.min(best, ceiling) + containment.penalty),
    demote: containment.demote,
    subtitled: containment.ceiling !== null,
  };
};
