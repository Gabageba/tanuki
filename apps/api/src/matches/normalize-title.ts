import {
  CYRILLIC_TO_LATIN,
  HOMOGLYPHS,
  NOISE_TOKENS,
  PROBE_CUT_PATTERN,
  PROBE_MAX_LENGTH,
  PROBE_MAX_TOKENS,
  RU_SUFFIXES,
  STEM_MAX_LENGTH,
  STEM_MIN_LENGTH,
  TITLE_SCRIPT,
  TITLE_SPLIT_PATTERN,
  VARIANT_TOKENS,
  type MatchSubject,
  type TitleScript,
  type TitleVariant,
} from './models';

const CYRILLIC_PATTERN = /[а-яё]/i;
const DASHES_PATTERN = /[-‐‑‒–—―·•~〜]/g;
const APOSTROPHES_PATTERN = /['’‘‛`]/g;
const DIACRITICS_PATTERN = /[̀-ͯ]/g;
const NON_WORD_PATTERN = /[^\p{L}\p{N}]+/gu;
const TRAILING_BRACKET_PATTERN = /^(.*?)[([{【]([^)\]}】]+)[)\]}】]\s*$/;

/**
 * Приводит название к форме, в которой его можно сравнивать: снимает диакритику и регистр,
 * разводит склейки через дефис/тире, выбрасывает пунктуацию.
 *
 * Осознанно НЕ делает `й -> и` и не снимает `ъ/ь`: это ломает больше названий, чем чинит.
 * Транслитерация тоже не здесь — она порождает отдельный вариант (см. romanize).
 */
export const normalizeTitle = (value: string): string => {
  return value
    .normalize('NFKD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(APOSTROPHES_PATTERN, '')
    .replace(DASHES_PATTERN, ' ')
    .replace(NON_WORD_PATTERN, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

export const tokenize = (value: string): string[] => {
  return value.split(' ').filter(Boolean);
};

/** Каким скриптом записано название. Смешанные считаем кириллицей — так их пишут RU-каталоги. */
export const scriptOf = (value: string): TitleScript => {
  return CYRILLIC_PATTERN.test(value) ? TITLE_SCRIPT.CYRILLIC : TITLE_SCRIPT.LATIN;
};

/**
 * Практическая транслитерация кириллицы. Ловит заимствования, записанные русскими буквами
 * («Соло Левелинг» -> «solo leveling»), и ничего не может сделать с переводами: «Ванпанчмен»
 * и «One Punch Man» останутся разными строками — этот случай лечится только ручной связью.
 */
export const romanize = (value: string): string => {
  let result = '';
  for (const char of value) {
    result += CYRILLIC_TO_LATIN.get(char) ?? char;
  }
  // Русские окончания прилагательных дают «-y» вместо «-yy»: «древний» -> «drevny».
  return result.replace(/yy/g, 'y').replace(/\s+/g, ' ').trim();
};

/**
 * Схлопывает кириллические буквы, неотличимые на вид от латинских. Нужно только для проверки на
 * строгое равенство: источники регулярно пишут название смешанным скриптом.
 */
export const foldHomoglyphs = (value: string): string => {
  let result = '';
  for (const char of value) {
    result += HOMOGLYPHS.get(char) ?? char;
  }
  return result;
};

/**
 * Грубый стеммер для русского. Не претендует на морфологическую точность — его задача свести
 * «Истребитель демонов» и «Истребители демонов» к одному набору основ, потому что переводы у
 * разных источников расходятся именно так.
 */
export const stemRu = (token: string): string => {
  // Только для кириллицы: обрезка до STEM_MAX_LENGTH схлопнула бы длинные латинские слова,
  // различающиеся хвостом, а никакой пользы для них не даёт — окончания-то русские.
  if (!CYRILLIC_PATTERN.test(token)) return token;
  if (token.length < STEM_MIN_LENGTH) return token;

  const suffix = RU_SUFFIXES.find(
    (candidate) =>
      token.endsWith(candidate) && token.length - candidate.length >= STEM_MIN_LENGTH - 1,
  );
  const stripped = suffix ? token.slice(0, -suffix.length) : token;
  return stripped.slice(0, STEM_MAX_LENGTH);
};

/**
 * Раскрывает одну строку названия в несколько.
 *
 * Два массовых паттерна RU-каталогов, ради которых это существует:
 *   «Магическая битва / Jujutsu Kaisen»            -> два названия в одной строке
 *   «Клинок, рассекающий демонов (Kimetsu no Yaiba)» -> второе название в скобках
 * Во втором случае скобку раскрываем только если её содержимое написано другим скриптом:
 * иначе это пометка формата, а не название, и её надо просто выбросить.
 */
export const expandTitle = (value: string): string[] => {
  const parts = value
    .split(TITLE_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.flatMap((part) => {
    const bracketed = TRAILING_BRACKET_PATTERN.exec(part);
    if (!bracketed) return [part];

    const head = bracketed[1]!.trim();
    const inner = bracketed[2]!.trim();
    if (!head) return [inner];

    const innerTokens = tokenize(normalizeTitle(inner));

    // Скобка с пометкой издания («Магическая битва (Цветная версия)») остаётся частью
    // названия: снеся её здесь, мы выдали бы цветной вариант за точное совпадение с обычным.
    // Пусть с ней разбирается containmentScore — он умеет понизить уверенность.
    if (innerTokens.some((token) => VARIANT_TOKENS.has(token))) return [part];

    // Порядок проверок важен: «Naruto (манга)» — это латинская голова и кириллическая скобка,
    // то есть формально разные скрипты, но «манга» не второе название, а пометка формата.
    const isNoise = innerTokens.length > 0 && innerTokens.every((token) => NOISE_TOKENS.has(token));
    if (isNoise) return [head];

    // Скобка на другом скрипте — почти всегда оригинальное название. На том же скрипте это
    // подзаголовок или пометка издания: голова важнее, содержимое скобки как отдельное
    // название не годится.
    return scriptOf(head) !== scriptOf(inner) ? [head, inner] : [head];
  });
};

const pushVariant = (into: Map<string, TitleVariant>, value: string, derived: boolean): void => {
  const normalized = normalizeTitle(value);
  if (!normalized) return;

  const existing = into.get(normalized);
  // Одна и та же форма могла прийти и от источника, и из нашей транслитерации — настоящая
  // важнее, она не ограничена потолком.
  if (existing && !existing.derived) return;

  into.set(normalized, { value: normalized, script: scriptOf(value), derived });
};

/**
 * Полный набор форм названия, по которым тайтл можно узнать: сами названия, их раскрытия и
 * латинская транслитерация кириллических вариантов.
 *
 * Сознательно НЕ порождает «голову» названия без подзаголовка. Это выглядит полезным
 * («Solo Leveling» из «Solo Leveling: Ragnarok»), но ровно этот случай уже разбирает
 * containmentScore — причём умнее, потому что смотрит на отброшенный хвост. Отдельный
 * head-вариант просто обходил бы этот разбор и склеивал тайтл с его продолжением.
 */
export const titleVariants = (
  subject: Pick<MatchSubject, 'title' | 'altTitles'>,
): TitleVariant[] => {
  const variants = new Map<string, TitleVariant>();

  for (const raw of [subject.title, ...subject.altTitles]) {
    if (!raw?.trim()) continue;

    for (const expanded of expandTitle(raw)) {
      pushVariant(variants, expanded, false);

      if (scriptOf(expanded) === TITLE_SCRIPT.CYRILLIC) {
        pushVariant(variants, romanize(normalizeTitle(expanded)), true);
      }
    }
  }

  return [...variants.values()];
};

/**
 * Обрезает название до поискового запроса. Движки поиска на сайтах плохо работают с длинными
 * строками — а точность мы всё равно восстанавливаем скорингом по полным названиям, так что
 * зонд можно резать смело: он инструмент recall, не precision.
 */
export const probeHead = (value: string): string => {
  const cut = value.split(PROBE_CUT_PATTERN)[0]?.trim() || value.trim();
  const tokens = tokenize(cut).slice(0, PROBE_MAX_TOKENS);

  let result = '';
  for (const token of tokens) {
    const next = result ? `${result} ${token}` : token;
    if (next.length > PROBE_MAX_LENGTH) break;
    result = next;
  }

  return result || cut.slice(0, PROBE_MAX_LENGTH);
};
