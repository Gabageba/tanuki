import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { RawChapter } from '../parsers-client/parsers-client.types';
import { alignChapter, findAnchors, projectIndex, toReadingOrder } from './chapter-alignment';
import { CHAPTER_NUMBERING, type ChapterNumbering } from '@tanuki/contracts';
import { detectNumbering } from '../common/normalize';

/**
 * Реальные списки глав одних и тех же тайтлов с разных источников (fixtures/<тайтл>/<источник>.json,
 * ветка → [том, номер, название]). Каждая глава каждой ветки переносится на каждую ветку других
 * источников и сверяется с эталоном.
 *
 * Эталон — однозначно совпавшее название у глав с близкими номерами, иначе тот же номер, если
 * названия ему не противоречат; спорные главы в счёт не идут. Нормализация названий здесь своя и
 * нарочно простая, чтобы эталон не менялся вместе с проверяемым кодом. Эталон не безупречен:
 * «Конец» у ветки, оборванной на 179-й главе, он принимает за финальную 200-ю, а безымянную
 * экстру 573.5 не узнаёт в «Экстре Strong World», — поэтому ошибок допускается не ноль.
 */

type FixtureRow = [number | null, number | null, string | null];

type Branch = {
  name: string;
  chapters: RawChapter[];
  titles: Map<RawChapter, string | null>;
  byTitle: Map<string, RawChapter[]>;
  numbering: ChapterNumbering;
  byNumber: Map<string, RawChapter[]>;
};

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
/** Ветки короче — обрывки из пары глав другого переводчика, сверять по ним нечего. */
const MIN_BRANCH_LENGTH = 40;
const REFERENCE_SKIP_WORD = /^(том|т|vol|глава|гл|chapter|ch|экстра|extra|\d+)$/;
/** «Клятва» у Ван-Писа — и 52-я глава, и 595-я: название — эталон только для близких номеров. */
const REFERENCE_TITLE_WINDOW = 10;

let nextId = 1;

const referenceTitle = (title: string | null) => {
  const words = (title ?? '')
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const start = words.findIndex((word) => !REFERENCE_SKIP_WORD.test(word));
  return start === -1 ? null : words.slice(start).join(' ');
};

/** Номер главы, сравнимый между ветками с одной нумерацией: при нумерации по томам — с томом. */
const numberKey = (chapter: RawChapter, numbering: ChapterNumbering) =>
  numbering === CHAPTER_NUMBERING.PER_VOLUME
    ? `${chapter.volume}:${chapter.number}`
    : `${chapter.number}`;

const groupBy = <K>(chapters: RawChapter[], key: (chapter: RawChapter) => K) => {
  const groups = new Map<K, RawChapter[]>();
  for (const chapter of chapters) {
    const value = key(chapter);
    groups.set(value, [...(groups.get(value) ?? []), chapter]);
  }
  return groups;
};

const toBranch = (name: string, rows: FixtureRow[]): Branch => {
  const chapters = rows.map(([volume, number, title]): RawChapter => ({
    id: nextId++,
    volume,
    number,
    title,
    url: '',
    scanlator: null,
    uploadDate: 0,
    branch: null,
    source: 'fixture',
  }));
  const titles = new Map(chapters.map((chapter) => [chapter, referenceTitle(chapter.title)]));
  const numbering = detectNumbering(chapters);
  return {
    name,
    chapters,
    titles,
    byTitle: groupBy(chapters, (chapter) => titles.get(chapter) ?? ''),
    numbering,
    byNumber: groupBy(chapters, (chapter) => numberKey(chapter, numbering)),
  };
};

const loadBranches = (work: string): Branch[] =>
  fs.readdirSync(path.join(FIXTURES_DIR, work)).flatMap((file) => {
    const { branches } = JSON.parse(
      fs.readFileSync(path.join(FIXTURES_DIR, work, file), 'utf8'),
    ) as { branches: Record<string, FixtureRow[]> };
    return Object.entries(branches)
      .filter(([, rows]) => rows.length >= MIN_BRANCH_LENGTH)
      .map(([branch, rows]) => toBranch(`${file}/${branch}`, rows));
  });

const findReference = (mark: RawChapter, source: Branch, target: Branch) => {
  const title = source.titles.get(mark);
  if (title) {
    const [inSource, ...otherSource] = source.byTitle.get(title) ?? [];
    const [inTarget, ...otherTarget] = target.byTitle.get(title) ?? [];
    const near =
      mark.number === null ||
      inTarget?.number == null ||
      Math.abs(mark.number - inTarget.number) <= REFERENCE_TITLE_WINDOW;
    if (inSource && inTarget && otherSource.length === 0 && otherTarget.length === 0 && near) {
      return inTarget;
    }
  }

  // Номера разных нумераций — «Сезон 2, глава 5» и сквозная 85-я — эталоном быть не могут.
  if (source.numbering !== target.numbering) return undefined;
  const key = numberKey(mark, source.numbering);
  if (source.byNumber.get(key)?.length !== 1) return undefined;
  const [candidate, ...others] = target.byNumber.get(key) ?? [];
  if (!candidate || others.length > 0) return undefined;
  const candidateTitle = target.titles.get(candidate);
  return title && candidateTitle && title !== candidateTitle ? undefined : candidate;
};

const measure = () => {
  const totals = {
    checked: 0,
    exact: 0,
    exactWrong: 0,
    approximate: 0,
    approximateAhead: 0,
    missing: 0,
  };

  for (const work of fs.readdirSync(FIXTURES_DIR)) {
    const branches = loadBranches(work);
    for (const source of branches) {
      for (const target of branches) {
        if (source.name.split('/')[0] === target.name.split('/')[0]) continue;

        // То же, что alignChapter, но якоря — один раз на пару веток, а не на каждую главу:
        // иначе на тысячах глав Ван-Писа тест идёт минутами.
        const orderedSource = toReadingOrder(source.chapters);
        const orderedTarget = toReadingOrder(target.chapters);
        const anchors = findAnchors(orderedSource, orderedTarget);

        orderedSource.forEach((mark, markIndex) => {
          const reference = findReference(mark, source, target);
          if (!reference) return;
          totals.checked++;

          const projected = projectIndex(anchors, markIndex, orderedTarget.length);
          const chapter = projected && orderedTarget[projected.index];
          if (!projected || !chapter) totals.missing++;
          else if (projected.confidence === READING_MARK_CONFIDENCE.APPROXIMATE) {
            totals.approximate++;
            if ((chapter.number ?? 0) > (reference.number ?? 0)) totals.approximateAhead++;
          } else if (chapter === reference) totals.exact++;
          else totals.exactWrong++;
        });
      }
    }
  }
  return totals;
};

describe('alignChapter на реальных списках глав', () => {
  it('держит точность не хуже достигнутой', { timeout: 30_000 }, () => {
    const totals = measure();

    expect(totals.checked).toBeGreaterThan(155_000);
    // Уверенно, но не туда — худшая ошибка: пользователь пропустит главы и не узнает об этом.
    expect(totals.exactWrong).toBeLessThanOrEqual(1);
    expect(totals.exact / totals.checked).toBeGreaterThan(0.999);
    // Примерное место впереди эталона. Почти всё здесь — экстры, которые источники ставят в разные
    // места: «Тюрьма» у одного после 31-й главы, у другого перед ней, и кто прочитал её там, где
    // она после, прочитал и 31-ю. Остальное — перемешанные «новые версии» глав у desume и главы,
    // чьи названия источники поменяли местами («Пушки решают» / «Из Киото» у «Бензопилы», две
    // экстры конца первого сезона и «Пролог» первого и второго сезонов у «Башни Бога»).
    expect(totals.approximateAhead).toBeLessThanOrEqual(33);
    expect(totals.missing).toBeLessThanOrEqual(2);
  });

  /**
   * «Башня Бога»: половина источников нумерует главы по сезонам, половина сквозной. Без названий
   * общих глав нет, и остаётся перевод номера. Истинная сквозная глава — у senkuro, где есть и
   * сезоны, и сквозные номера, и названия; для remanga, у которой названий нет, — через readmanga
   * с той же нумерацией.
   */
  it('по сезонам без названий ↔ сквозная без названий: не дальше прочитанного', () => {
    const load = (file: string, branch: string) =>
      toBranch(
        `${file}/${branch}`,
        (
          JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'tower-of-god', file), 'utf8')) as {
            branches: Record<string, FixtureRow[]>;
          }
        ).branches[branch] ?? [],
      );
    const senkuro = load('senkuro.json', 'Gemini Manga Clan');
    const readmanga = load('readmanga.json', 'Gemini Manga Clan Переводчик');
    const remanga = load('remanga.json', 'Ямагути');
    const wamanga = load('wamanga.json', '');

    // Сквозной номер главы readmanga по однозначному названию на senkuro. Номер меньше уже
    // найденного — не та глава: «Пролог» второго сезона совпадает с прологом первого.
    const globalNumbers = new Map<string, number>();
    let lastGlobalNumber = Number.NEGATIVE_INFINITY;
    for (const chapter of toReadingOrder(readmanga.chapters)) {
      const title = readmanga.titles.get(chapter);
      const [inReadmanga, ...otherReadmanga] = readmanga.byTitle.get(title ?? '') ?? [];
      const [inSenkuro, ...otherSenkuro] = senkuro.byTitle.get(title ?? '') ?? [];
      if (!title || !inReadmanga || !inSenkuro || otherReadmanga.length || otherSenkuro.length) {
        continue;
      }
      if (inSenkuro.number !== null && inSenkuro.number >= lastGlobalNumber) {
        globalNumbers.set(`${chapter.volume}:${chapter.number}`, inSenkuro.number);
        lastGlobalNumber = inSenkuro.number;
      }
    }

    const offsets: number[] = [];
    for (const mark of remanga.chapters) {
      const reference = globalNumbers.get(`${mark.volume}:${mark.number}`);
      if (reference === undefined) continue;
      const aligned = alignChapter(remanga.chapters, mark.id, wamanga.chapters);
      expect(aligned?.confidence).toBe(READING_MARK_CONFIDENCE.APPROXIMATE);
      offsets.push((aligned?.chapter.number ?? Number.NaN) - reference);
    }

    expect(offsets.length).toBeGreaterThan(600);
    // Вперёд — только экстра в конце первого сезона: readmanga нумерует её 81-й, остальные 80-й.
    expect(offsets.filter((offset) => offset > 0)).toEqual([1]);
    expect(offsets.every((offset) => offset >= -3)).toBe(true);
  });
});
