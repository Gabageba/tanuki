import { MATCH_CONFIDENCE, type MatchConfidence } from '@tanuki/contracts';
import { MATCH_MAX_PER_SOURCE, MATCH_TIE_DELTA } from './models';

export type ScoredEntry = {
  sourceId: string;
  /** Ключ дедупликации внутри источника — адрес тайтла на самом источнике. */
  key: string;
  score: number;
  confidence: MatchConfidence;
};

export type SelectedEntry<T extends ScoredEntry> = T & {
  /** С этого источника пришло несколько неразличимых кандидатов, и мы не выбрали между ними. */
  tied: boolean;
};

/**
 * Допуск для сравнения скоров: 1 - 0.95 в двоичной арифметике даёт 0.050000000000000044, и
 * строгое сравнение с дельтой развалило бы ничью там, где её видно глазом.
 */
const EPSILON = 1e-9;

/**
 * Порядок выдачи. Сортировать по одному лишь score нельзя: метаданные могут добить счёт
 * почти до единицы кандидату, чьё название совпало лишь отчасти («Магическая битва (Цветная
 * версия)» при совпавших годе, авторе и тегах), и он встал бы выше настоящих точных
 * совпадений. Уверенность отражает силу совпадения названий и потому идёт первой.
 */
const confidenceRank = (confidence: MatchConfidence): number => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return 0;
    case MATCH_CONFIDENCE.EXACT:
      return 1;
    case MATCH_CONFIDENCE.HIGH:
      return 2;
    case MATCH_CONFIDENCE.LOW:
      return 3;
  }
};

const isCertain = (confidence: MatchConfidence): boolean =>
  confidence === MATCH_CONFIDENCE.CONFIRMED || confidence === MATCH_CONFIDENCE.EXACT;

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

const dedupe = <T extends ScoredEntry>(entries: T[]): T[] => {
  // Часть парсеров отдаёт один и тот же тайтл в выдаче несколько раз — без этого он выглядел
  // бы как «две версии на источнике».
  const best = new Map<string, T>();
  for (const entry of entries) {
    const previous = best.get(entry.key);
    if (!previous || entry.score > previous.score) best.set(entry.key, entry);
  }
  return [...best.values()];
};

/**
 * Оставляет лучшее с каждого источника — и вместе с ним тех, кто идёт вплотную.
 *
 * Ничья бывает двух видов, и лечатся они одинаково. Либо на источнике действительно лежат две
 * версии тайтла (цветная и обычная, разные команды перевода), либо алгоритм не смог выбрать.
 * В обоих случаях показать оба варианта честнее, чем молча угадать: рядом есть кнопки
 * подтверждения и скрытия, лишний вариант убирается в один клик.
 */
export const selectPerSource = <T extends ScoredEntry>(entries: T[]): SelectedEntry<T>[] => {
  const bySource = new Map<string, T[]>();
  for (const entry of entries) {
    const list = bySource.get(entry.sourceId) ?? [];
    list.push(entry);
    bySource.set(entry.sourceId, list);
  }

  const selected: SelectedEntry<T>[] = [];

  for (const group of bySource.values()) {
    const ranked = dedupe(group).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best) continue;

    const tiedGroup = ranked
      .slice(0, MATCH_MAX_PER_SOURCE)
      .filter((entry) => best.score - entry.score <= MATCH_TIE_DELTA + EPSILON);

    const isTie = tiedGroup.length > 1;
    // Понижаем, только если в группе нет ни одного уверенного совпадения. Два точных — это
    // настоящие дубликаты на сайте. Точный рядом с изданием («Магическая битва» и
    // «Магическая битва (Цветная версия)») — тоже не повод сомневаться в точном: мы как раз
    // знаем, который из них основной. А вот когда вплотную идут два нечётких, выбрать между
    // ними нечем, и это само по себе неуверенность.
    const shouldDemote = isTie && !tiedGroup.some((entry) => isCertain(entry.confidence));

    for (const entry of tiedGroup) {
      selected.push({
        ...entry,
        confidence: shouldDemote ? demoteOnce(entry.confidence) : entry.confidence,
        tied: isTie,
      });
    }
  }

  return selected.sort(
    (a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence) || b.score - a.score,
  );
};
