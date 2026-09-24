import { CHAPTER_NUMBERING, READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import { compareChapterNumber, detectNumbering } from '../common/normalize';
import type { RawChapter } from '../parsers-client/parsers-client.types';
import type { AlignedChapter, ChapterAnchor, ChapterSnapshot, WeightedAnchor } from './models';

type ChapterKey = (chapter: ChapterSnapshot) => string | null;

const NUMBER_WEIGHT = 2;
const TITLE_WEIGHT = 1;

/** Слова, которыми источники каждый по-своему начинают название: «Глава 12:», «Т.3 Гл.5.»,
 *  «1 - 1 Жестокость», «1. Глава 1 …», «Экстра: Омаке». Числа в начале срезаются вместе с ними. */
const TITLE_PREFIX_WORDS = new Set([
  'том',
  'т',
  'vol',
  'volume',
  'глава',
  'гл',
  'chapter',
  'ch',
  'экстра',
  'extra',
]);

const volumeOrder = (chapter: RawChapter) => chapter.volume ?? Number.POSITIVE_INFINITY;

const compareVolume = (a: RawChapter, b: RawChapter) => {
  const difference = volumeOrder(a) - volumeOrder(b);
  return Number.isNaN(difference) ? 0 : difference;
};

/**
 * Главы ветки в том порядке, в котором их читают. При сквозной нумерации порядок задаёт номер, а
 * том только разводит одинаковые номера: тома у источников бывают проставлены с ошибками, и глава
 * с чужим томом не должна уезжать в другое место списка. Главы без тома при нумерации по томам
 * идут после всех томов — это свежие главы, которые ещё ни в один том не вошли.
 */
export const toReadingOrder = (chapters: RawChapter[]): RawChapter[] => {
  const byVolume = detectNumbering(chapters) === CHAPTER_NUMBERING.PER_VOLUME;
  return [...chapters].sort((a, b) =>
    byVolume
      ? compareVolume(a, b) || compareChapterNumber(a, b)
      : compareChapterNumber(a, b) || compareVolume(a, b),
  );
};

/** Название без служебного префикса, регистра и пунктуации. Без единого слова, кроме префикса и
 *  чисел, — не название, а тот же номер, и якорем оно быть не может. */
export const normalizeChapterTitle = (title: string | null): string | null => {
  if (!title) return null;

  const words = title
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const start = words.findIndex((word) => !TITLE_PREFIX_WORDS.has(word) && !/^\p{N}+$/u.test(word));
  return start === -1 ? null : words.slice(start).join(' ');
};

const volumeNumberKey: ChapterKey = (chapter) =>
  chapter.volume !== null && chapter.number !== null ? `${chapter.volume}:${chapter.number}` : null;

const numberKey: ChapterKey = (chapter) => (chapter.number !== null ? `${chapter.number}` : null);

const titleKey: ChapterKey = (chapter) => normalizeChapterTitle(chapter.title);

/** Индекс главы по ключу; ключ, встретившийся дважды, неоднозначен и помечается -1. */
const indexByUniqueKey = (chapters: ChapterSnapshot[], key: ChapterKey) => {
  const indexes = new Map<string, number>();
  chapters.forEach((chapter, index) => {
    const value = key(chapter);
    if (value === null) return;
    indexes.set(value, indexes.has(value) ? -1 : index);
  });
  return indexes;
};

/** Ключ номера, которым можно сравнивать эти два списка, — только при одинаковой нумерации. */
const comparableNumberKey = (source: RawChapter[], target: RawChapter[]): ChapterKey | null => {
  const numbering = detectNumbering(source);
  if (numbering !== detectNumbering(target)) return null;
  return numbering === CHAPTER_NUMBERING.PER_VOLUME ? volumeNumberKey : numberKey;
};

/** Пары глав, однозначно совпавших по ключу. */
const matchByKey = (source: RawChapter[], target: RawChapter[], key: ChapterKey) => {
  const targetIndexes = indexByUniqueKey(target, key);
  const anchors: ChapterAnchor[] = [];
  for (const [value, sourceIndex] of indexByUniqueKey(source, key)) {
    const targetIndex = targetIndexes.get(value);
    if (sourceIndex === -1 || targetIndex === undefined || targetIndex === -1) continue;
    anchors.push({ sourceIndex, targetIndex });
  }
  return anchors;
};

/**
 * Самая тяжёлая цепочка якорей, где обе стороны идут строго вперёд. Всё, что в неё не вошло,
 * противоречит порядку чтения — это ложное совпадение вроде одинаковой «Экстры» или экстра,
 * которую источники поставили по разные стороны от соседней главы.
 */
const keepMonotonic = (anchors: WeightedAnchor[]): ChapterAnchor[] => {
  const sorted = [...anchors].sort(
    (a, b) => a.sourceIndex - b.sourceIndex || a.targetIndex - b.targetIndex,
  );
  const best: number[] = [];
  const previous: number[] = [];
  // Дерево Фенвика по targetIndex: в узле — индекс в sorted якоря с самой тяжёлой цепочкой.
  const size = Math.max(0, ...sorted.map((anchor) => anchor.targetIndex)) + 1;
  const tree = new Array<number>(size + 1).fill(-1);
  const heavier = (a: number, b: number) =>
    a === -1 || (b !== -1 && (best[b] ?? 0) > (best[a] ?? 0)) ? b : a;
  const query = (position: number) => {
    let found = -1;
    for (let node = position; node > 0; node -= node & -node)
      found = heavier(found, tree[node] ?? -1);
    return found;
  };
  const update = (position: number, index: number) => {
    for (let node = position; node <= size; node += node & -node) {
      tree[node] = heavier(tree[node] ?? -1, index);
    }
  };

  // Якоря одной главы первого списка друг друга не продолжают: сначала считаются все, потом
  // попадают в дерево.
  for (let start = 0; start < sorted.length;) {
    let end = start;
    while (sorted[end]?.sourceIndex === sorted[start]?.sourceIndex) end++;
    for (let index = start; index < end; index++) {
      const anchor = sorted[index];
      if (!anchor) continue;
      const before = query(anchor.targetIndex);
      previous[index] = before;
      best[index] = anchor.weight + (before === -1 ? 0 : (best[before] ?? 0));
    }
    for (let index = start; index < end; index++) {
      update((sorted[index]?.targetIndex ?? 0) + 1, index);
    }
    start = end;
  }

  const chain: ChapterAnchor[] = [];
  for (let index = query(size); index !== -1; index = previous[index] ?? -1) {
    const anchor = sorted[index];
    if (anchor) chain.push({ sourceIndex: anchor.sourceIndex, targetIndex: anchor.targetIndex });
  }
  return chain.reverse();
};

/** Одинаковые названия глав, чьи номера разошлись дальше этого, — скорее общее «Конец» или
 *  «Экстра» у разных глав, чем одна и та же глава. */
const TITLE_NUMBER_WINDOW = 10;

/**
 * Якоря — главы, совпавшие однозначно по номеру и по названию. Номер весит больше: названия
 * одной главы разные команды переводят по-разному. Но если название главы прямо указывает на
 * другую главу рядом, номер уже не якорь: так выглядит сдвиг нумерации, когда у одного
 * источника есть лишняя глава, или две экстры, которые источники пронумеровали наоборот.
 */
export const findAnchors = (source: RawChapter[], target: RawChapter[]): ChapterAnchor[] => {
  const key = comparableNumberKey(source, target);
  const titleAnchors = matchByKey(source, target, titleKey).filter((anchor) => {
    const sourceNumber = source[anchor.sourceIndex]?.number ?? null;
    const targetNumber = target[anchor.targetIndex]?.number ?? null;
    return (
      !key ||
      sourceNumber === null ||
      targetNumber === null ||
      Math.abs(sourceNumber - targetNumber) <= TITLE_NUMBER_WINDOW
    );
  });

  const anchors = new Map<string, WeightedAnchor>();
  const titledSources = new Set<number>();
  const titledTargets = new Set<number>();
  for (const anchor of titleAnchors) {
    anchors.set(`${anchor.sourceIndex}:${anchor.targetIndex}`, { ...anchor, weight: TITLE_WEIGHT });
    titledSources.add(anchor.sourceIndex);
    titledTargets.add(anchor.targetIndex);
  }

  for (const anchor of key ? matchByKey(source, target, key) : []) {
    const existing = anchors.get(`${anchor.sourceIndex}:${anchor.targetIndex}`);
    if (existing) existing.weight += NUMBER_WEIGHT;
    else if (!titledSources.has(anchor.sourceIndex) && !titledTargets.has(anchor.targetIndex)) {
      anchors.set(`${anchor.sourceIndex}:${anchor.targetIndex}`, {
        ...anchor,
        weight: NUMBER_WEIGHT,
      });
    }
  }

  return keepMonotonic([...anchors.values()]);
};

/**
 * Индекс главы второго списка для главы markIndex первого. Совпала сама — точно. Между двумя
 * якорями её место переносится пропорционально и округляется вниз: лучше показать чуть раньше,
 * чем проскочить непрочитанное. До первого и после последнего якоря — на столько же глав от
 * него: пропорция от края списка ничего не значит, когда ветка начинается со сто двадцатой главы.
 */
export const projectIndex = (anchors: ChapterAnchor[], markIndex: number, targetLength: number) => {
  let left: ChapterAnchor | undefined;
  let right: ChapterAnchor | undefined;
  for (const anchor of anchors) {
    if (anchor.sourceIndex === markIndex) {
      return { index: anchor.targetIndex, confidence: READING_MARK_CONFIDENCE.EXACT };
    }
    if (anchor.sourceIndex < markIndex) left = anchor;
    else if (!right) right = anchor;
  }

  let index: number;
  if (left && right) {
    const ratio = (markIndex - left.sourceIndex) / (right.sourceIndex - left.sourceIndex);
    index = left.targetIndex + Math.floor(ratio * (right.targetIndex - left.targetIndex));
  } else if (left) {
    index = Math.min(left.targetIndex + markIndex - left.sourceIndex, targetLength - 1);
  } else if (right) {
    index = right.targetIndex - (right.sourceIndex - markIndex);
  } else {
    return null;
  }
  // Меньше нуля — всё прочитанное лежит раньше первой главы второго списка.
  return index < 0 ? null : { index, confidence: READING_MARK_CONFIDENCE.APPROXIMATE };
};

/**
 * Номер, переведённый из «том + номер» в сквозной, ошибается на 0–3 главы и почти всегда вперёд
 * (сверено на «Башне Бога» с восьми источников): экстры в томе одни источники нумеруют целыми
 * номерами, другие дробными. Столько глав отметка отступает назад, чтобы не проскочить
 * непрочитанное.
 */
const GLOBAL_NUMBER_MARGIN = 3;

/** Смещение каждого тома при нумерации по томам — сумма последних целых номеров томов до него. */
const volumeOffsets = (chapters: RawChapter[]) => {
  const lastByVolume = new Map<number, number>();
  for (const { volume, number } of chapters) {
    if (volume === null || number === null) continue;
    lastByVolume.set(volume, Math.max(lastByVolume.get(volume) ?? 0, Math.floor(number)));
  }

  const offsets = new Map<number, number>();
  let total = 0;
  for (const volume of [...lastByVolume.keys()].sort((a, b) => a - b)) {
    offsets.set(volume, total);
    total += lastByVolume.get(volume) ?? 0;
  }
  return offsets;
};

const toGlobalNumber = (chapter: RawChapter, offsets: Map<number, number>) => {
  const offset = chapter.volume === null ? undefined : offsets.get(chapter.volume);
  return offset === undefined || chapter.number === null ? null : offset + chapter.number;
};

/**
 * Запасной путь, когда одна ветка нумерует главы по томам («Сезон 2, глава 5»), другая сквозной,
 * а общих глав по названиям нет — например, названий нет ни у одной. Номер по томам переводится в
 * сквозной, и берётся последняя глава, которая не дальше него. Перевод неточен, поэтому только
 * примерно и с отступом назад.
 */
export const alignByGlobalNumber = (
  source: RawChapter[],
  mark: RawChapter,
  target: RawChapter[],
): AlignedChapter | null => {
  const sourceByVolume = detectNumbering(source) === CHAPTER_NUMBERING.PER_VOLUME;
  const targetByVolume = detectNumbering(target) === CHAPTER_NUMBERING.PER_VOLUME;
  if (sourceByVolume === targetByVolume) return null;

  const sourceOffsets = sourceByVolume ? volumeOffsets(source) : null;
  const targetOffsets = targetByVolume ? volumeOffsets(target) : null;
  const markNumber = sourceOffsets ? toGlobalNumber(mark, sourceOffsets) : mark.number;
  if (markNumber === null) return null;
  // В первом томе переводить нечего — отступ нужен, только когда перед томом отметки что-то было.
  // Номера второго списка, переведённые из томов, ошибаются вперёд сами, и отступ им не нужен.
  const shifted = sourceOffsets && (mark.volume === null ? 0 : sourceOffsets.get(mark.volume));
  const limit = shifted ? markNumber - GLOBAL_NUMBER_MARGIN : markNumber;

  let best: { chapter: RawChapter; number: number } | undefined;
  for (const chapter of target) {
    const number = targetOffsets ? toGlobalNumber(chapter, targetOffsets) : chapter.number;
    if (number === null || number > limit) continue;
    if (!best || number > best.number) best = { chapter, number };
  }
  return best ? { chapter: best.chapter, confidence: READING_MARK_CONFIDENCE.APPROXIMATE } : null;
};

/**
 * Глава ветки target, соответствующая главе markChapterId ветки source. Обе ветки — полные
 * списки глав: выравниваются они целиком, поэтому разная нумерация, пропуски и лишние главы
 * одного из источников сдвигают отметку не дальше ближайших совпавших глав. Общих глав нет
 * совсем — остаётся перевод номера между нумерацией по томам и сквозной.
 */
export const alignChapter = (
  source: RawChapter[],
  markChapterId: number,
  target: RawChapter[],
): AlignedChapter | null => {
  const orderedSource = toReadingOrder(source);
  const orderedTarget = toReadingOrder(target);
  const markIndex = orderedSource.findIndex((chapter) => chapter.id === markChapterId);
  const mark = orderedSource[markIndex];
  if (!mark) return null;

  const anchors = findAnchors(orderedSource, orderedTarget);
  if (anchors.length === 0) return alignByGlobalNumber(orderedSource, mark, orderedTarget);

  const projected = projectIndex(anchors, markIndex, orderedTarget.length);
  const chapter = projected ? orderedTarget[projected.index] : undefined;
  return projected && chapter ? { chapter, confidence: projected.confidence } : null;
};

/**
 * Запасной путь, когда полного списка глав источника отметки нет (источник лежит): глава
 * узнаётся по снимку из строки прогресса — только если совпала однозначно. Номер без тома
 * сравним лишь со сквозной нумерацией: какой была нумерация у источника, по снимку не понять.
 */
export const alignBySnapshot = (
  snapshot: ChapterSnapshot,
  target: RawChapter[],
): AlignedChapter | null => {
  const keys = [volumeNumberKey, titleKey];
  if (snapshot.volume === null && detectNumbering(target) === CHAPTER_NUMBERING.GLOBAL) {
    keys.push(numberKey);
  }

  for (const key of keys) {
    const value = key(snapshot);
    if (value === null) continue;
    const index = indexByUniqueKey(target, key).get(value);
    const chapter = index === undefined || index === -1 ? undefined : target[index];
    if (chapter) return { chapter, confidence: READING_MARK_CONFIDENCE.EXACT };
  }
  return null;
};
